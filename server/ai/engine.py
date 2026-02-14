from django.conf import settings
from langchain_ollama import ChatOllama
try:
    from langchain_groq import ChatGroq
except ImportError:
    ChatGroq = None
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, List, Union
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
import operator
import json
import time
import shutil

# Import our tools
from .tools import (
    list_all_points, get_point_value, 
    list_all_modules, list_all_scripts, list_all_fbds,
    get_fbd_program, get_script, get_hmi_page,
    set_point_value,
    create_device, create_point_group, create_point,
    create_script, create_fbd_program, create_hmi_page,
    create_module
)
from .rag import VectorStoreManager

# Define the State
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]

SMARTY_BASE_PROMPT = """
You are the Smarty SCADA/BMS Engineer. Your name is Smarty. You are running inside the Smarty SCADA/BMS software suite.
Your goal is to help operators monitor, troubleshoot, control, and CONFIGURE the system.

You have full administrative powers to:
1. PROVISION HARDWARE: Create Devices, IO Groups, and Points.
2. ENGINEER LOGIC: Write Python scripts and design FBD programs.
3. DESIGN VISUALS: Create HMI/Graphical pages for system modules.

GUIDELINES:
1. ANSWER DIRECTLY. Answer the user's query immediately without repetitive introductions.
2. IDENTITY: Only mention your name ("Smarty") or role if the user explicitly asks about your identity.
3. ONLY call tools when a user explicitly asks for system information or configuration. 
4. DO NOT proactively suggest creating things for simple greetings like 'hi' or 'hello'.
5. Use the PROVIDED CONTEXT to answer questions about the current system state.
6. BE CONCISE. Technical, precise, and safety-oriented.
"""

class AIEngine:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIEngine, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.ready = False
        self.error_msg = ""
        provider = getattr(settings, 'AI_PROVIDER', 'ollama')
        
        if provider == "groq":
            print(f"DEBUG: Initializing Turbo Mode (Groq) with model={settings.GROQ_MODEL}")
            if not ChatGroq:
                print("ERROR: langchain-groq not installed. Falling back to Ollama.")
                provider = "ollama"
        
        try:
            if provider == "ollama":
                print(f"DEBUG: Initializing AIEngine with model={settings.OLLAMA_MODEL} at {settings.OLLAMA_BASE_URL}")
                # Hardware check for Ollama only
                try:
                    total, used, free = shutil.disk_usage('/')
                    print(f"DEBUG: Disk Usage: Total={total // (2**30)}GB, Used={used // (2**30)}GB, Free={free // (2**30)}GB")
                    if free < (2 * 1024 * 1024 * 1024):
                        print("WARNING: Disk space is low for Ollama storage.")
                except: pass

                self.llm = ChatOllama(
                    base_url=settings.OLLAMA_BASE_URL,
                    model=settings.OLLAMA_MODEL,
                    temperature=0
                )
            else:
                self.llm = ChatGroq(
                    groq_api_key=settings.GROQ_API_KEY,
                    model_name=settings.GROQ_MODEL,
                    temperature=0
                )

            self.tools = [
                list_all_points, get_point_value, 
                list_all_modules, list_all_scripts, list_all_fbds,
                get_fbd_program, get_script, get_hmi_page,
                set_point_value,
                create_device, create_point_group, create_point,
                create_script, create_fbd_program, create_hmi_page,
                create_module
            ]
            
            # Use native tool binding if supported
            try:
                self.llm_with_tools = self.llm.bind_tools(self.tools)
                self.tools_enabled = True
                print(f"DEBUG: Tools bound successfully for {provider}")
            except Exception as e:
                print(f"DEBUG: {provider} does not natively support tool calling. Fallback enabled.")
                self.llm_with_tools = self.llm
                self.tools_enabled = True

            self.workflow = self._build_graph()
            self.app = self.workflow.compile()
            self.ready = True
            print(f"DEBUG: AIEngine ({provider}) initialized successfully.")
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"AI Engine Init Failed:\n{error_trace}")
            self.ready = False
            self.error_msg = str(e)

    def __init__(self):
        # Already initialized via __new__ and _initialize
        pass

    def get_system_summary(self):
        """Generates a brief summary of the system for prompt injection."""
        try:
            from devices.models import Point, Register
            from fbd.models import FBDProgram
            from main.models import Alarm, Fault
            
            point_count = Point.objects.count()
            reg_count = Register.objects.count()
            fbd_count = FBDProgram.objects.count()
            alarm_count = Alarm.objects.filter(is_active=True).count()
            fault_count = Fault.objects.filter(is_resolved=False).count()
            
            top_points = list(Point.objects.values('id', 'name')[:15])
            
            summary = (
                f"SYSTEM STATUS OVERVIEW:\n"
                f"- Points: {point_count}\n"
                f"- Registers (Hardware): {reg_count}\n"
                f"- FBD Programs: {fbd_count}\n"
                f"- ACTIVE ALARMS: {alarm_count}\n"
                f"- UNRESOLVED FAULTS: {fault_count}\n\n"
            )
            
            if alarm_count > 0:
                active_alarms = list(Alarm.objects.filter(is_active=True).values('name', 'description')[:5])
                summary += "ACTIVE ALARMS LIST:\n"
                summary += "\n".join([f"- {a['name']}: {a['description']}" for a in active_alarms]) + "\n\n"

            summary += "Top Points currently defined: " + ", ".join([f"{p['name']} (ID:{p['id']})" for p in top_points])
            return summary
        except Exception as e:
            return f"Error fetching system summary: {e}"


    def _build_graph(self):
        workflow = StateGraph(AgentState)

        # Define Nodes
        workflow.add_node("agent", self._call_model)
        
        # Define Edges
        workflow.set_entry_point("agent")
        
        # Always add tools node and edges (Manual fallback handles models like phi3)
        workflow.add_node("tools", self._call_tool_node)
        workflow.add_conditional_edges(
            "agent",
            self._should_continue,
            {
                "continue": "tools",
                "end": END
            }
        )
        workflow.add_edge("tools", "agent")

        return workflow

    def _call_model(self, state: AgentState):
        messages = state['messages']
        
        # 1. RAG Integration: Fetch context based on the last user message
        # 1. RAG context retrieval
        context = ""
        # Only perform RAG search on the FIRST turn (when there's only one user message)
        # and if the user message is long enough to be meaningful.
        last_user_msg = messages[-1].content if messages and isinstance(messages[-1], HumanMessage) else None
        
        if last_user_msg and len(messages) == 1 and len(last_user_msg) > 5:
            try:
                print(f"DEBUG: Performing RAG search for: {last_user_msg}")
                vsm = VectorStoreManager()
                # Limit k to reduce embedding/retrieval time
                docs = vsm.search(last_user_msg, k=3)
                if docs:
                    context += "\nSEARCH RESULTS (RAG):\n" + "\n---\n".join([d.page_content for d in docs])
                    print(f"DEBUG: RAG Search completed. Found {len(docs)} relevant context snippets.")
            except Exception as e:
                print(f"DEBUG: RAG Search failed: {e}")
        
        # 2. Prepend System Prompt and Context
        provider = getattr(settings, 'AI_PROVIDER', 'ollama')
        system_content = SMARTY_BASE_PROMPT
        
        if provider == "ollama":
            system_content += "\nTOOL USAGE (FALLBACK):\nIf you need a tool, output exactly: [TOOL_CALL: {\"name\": \"tool_name\", \"args\": {...}}]"
        
        if context:
            system_content += "\nCURRENT CONTEXT:\n" + context
            
        # Ensure SystemMessage is at the top
        final_messages = [SystemMessage(content=system_content)] + messages
        
        start_time = time.time()
        active_model = settings.GROQ_MODEL if provider == "groq" else settings.OLLAMA_MODEL
        
        try:
            response = self.llm_with_tools.invoke(final_messages)
            duration = time.time() - start_time
            print(f"DEBUG: LLM Invoke completed in {duration:.2f}s using {active_model}")
        except Exception as e:
            # Fallback to base LLM if binding fails at runtime
            print(f"DEBUG: Tool-calling issue with {active_model}: {e}. Falling back.")
            response = self.llm.invoke(final_messages)
            duration = time.time() - start_time
            print(f"DEBUG: LLM Fallback Invoke completed in {duration:.2f}s")

        # 3. Manual Tool Parsing (Fallback for models like phi3)
        if hasattr(response, 'content') and "[TOOL_CALL:" in response.content:
            import re
            import uuid
            matches = re.findall(r"\[TOOL_CALL:\s*({.*?})\s*\]", response.content, re.DOTALL)
            manual_calls = []
            for m in matches:
                try:
                    # Clean up the match to ensure valid JSON
                    m_clean = m.strip()
                    call_data = json.loads(m_clean)
                    manual_calls.append({
                        "name": call_data["name"],
                        "args": call_data.get("args", {}),
                        "id": f"manual_{uuid.uuid4().hex[:8]}"
                    })
                except Exception as parse_err:
                    print(f"DEBUG: Manual tool parse error: {parse_err}")
            
            if manual_calls:
                # Inject into the response object so the graph can find them
                response.tool_calls = manual_calls
                print(f"DEBUG: Parsed {len(manual_calls)} manual tool calls from response.")
                
        return {"messages": [response]}

    def _should_continue(self, state: AgentState):
        messages = state['messages']
        last_message = messages[-1]
        if last_message.tool_calls:
            return "continue"
        return "end"

    def _call_tool_node(self, state: AgentState):
        # We need to execute the tool calls
        # This part requires manually invoking the tools based on tool_calls
        # For LangGraph 0.1+, we can use ToolNode, but let's implement basic loop
        messages = state['messages']
        last_message = messages[-1]
        
        tool_outputs = []
        for tool_call in last_message.tool_calls:
            tool_name = tool_call['name']
            tool_args = tool_call['args']
            
            # Find the tool
            selected_tool = next((t for t in self.tools if t.name == tool_name), None)
            
            if selected_tool:
                try:
                    output = selected_tool.invoke(tool_args)
                except Exception as e:
                    output = f"Tool Execution Error: {str(e)}"
            else:
                output = f"Error: Tool {tool_name} not found."
                
            tool_outputs.append({
                "tool_call_id": tool_call['id'],
                "content": str(output)
            })
            
            # Add ToolMessage back to state
            # For simplicity in this demo, we can just append a Function/Tool message
            # But LangGraph expects specific ToolMessage format
            
        # Returning ToolMessages 
        # (This logic is simplified; using prebuilt ToolNode is better but manual gives control)
        from langchain_core.messages import ToolMessage
        
        tool_msgs = [
            ToolMessage(content=out["content"], tool_call_id=out["tool_call_id"])
            for out in tool_outputs
        ]
        
        return {"messages": tool_msgs}

    def stream_response(self, user_input: str, history: List[BaseMessage] = []):
        """
        Generator that yields chunks for streaming.
        """
        if not self.ready:
            yield f"AI Engine is not ready: {self.error_msg}. Please ensure your AI Provider is configured correctly."
            return

        initial_state = {"messages": history + [HumanMessage(content=user_input)]}

        # Using .stream() method of the compiled graph
        for event in self.app.stream(initial_state):
             for key, value in event.items():
                 if key == "agent":
                     msg = value["messages"][-1]
                     if msg.content:
                         # Filter out the raw [TOOL_CALL: ...] text if it was generated
                         import re
                         clean_content = re.sub(r"\[TOOL_CALL:.*?\]", "", msg.content, flags=re.DOTALL).strip()
                         if clean_content:
                             yield clean_content
                 elif key == "tools":
                     # No content to yield from tools node
                     pass
