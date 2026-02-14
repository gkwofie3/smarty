from django.conf import settings
from langchain_ollama import ChatOllama
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, List, Union
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
import operator

# Import our tools
from .tools import (
    list_all_points, get_point_value, 
    get_fbd_program, get_script, 
    set_point_value,
    create_device, create_point_group, create_point,
    create_script, create_fbd_program, create_hmi_page,
    create_module
)
from .rag import VectorStoreManager

# Define the State
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]

SMARTY_SYSTEM_PROMPT = """
You are the Smarty SCADA/BMS Engineer. You are running inside the Smarty SCADA/BMS software suite.
Your goal is to help operators monitor, troubleshoot, control, and CONFIGURE the system.

You have full administrative powers to:
1. PROVISION HARDWARE: Create Devices, IO Groups, and Points.
2. ENGINEER LOGIC: Write Python scripts and design FBD programs.
3. DESIGN VISUALS: Create HMI/Graphical pages for system modules.

GUIDELINES:
1. ALWAYS identify yourself as the Smarty Assistant/Engineer.
2. If a user describes a requirement (e.g. "Monitor a new pump"), PROACTIVELY suggest creating the device/points and writing the logic.
3. Use the PROVIDED CONTEXT to answer. Do NOT suggest SQL or pseudo-code. Use your TOOLS to perform actions.
4. BE CONCISE. Just give the facts or confirm the action taken.
5. If data is missing from context or you need to perform an action, use your TOOLS.
6. Be technical, precise, and safety-oriented.
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
        print(f"DEBUG: Initializing AIEngine with model={settings.OLLAMA_MODEL} at {settings.OLLAMA_BASE_URL}")
        try:
            import requests
            # Heartbeat check
            try:
                resp = requests.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=5)
                if resp.status_code != 200:
                    raise Exception(f"Ollama server returned {resp.status_code}")
                models = [m['name'] for m in resp.json().get('models', [])]
                print(f"DEBUG: Available models: {models}")
                if settings.OLLAMA_MODEL not in models and (settings.OLLAMA_MODEL + ":latest") not in models:
                    print(f"WARNING: Model {settings.OLLAMA_MODEL} not found in available models.")
            except Exception as e:
                print(f"DEBUG: Ollama connection check failed: {e}")
                raise Exception(f"Could not connect to Ollama at {settings.OLLAMA_BASE_URL}. Is it running?")

            self.llm = ChatOllama(
                base_url=settings.OLLAMA_BASE_URL,
                model=settings.OLLAMA_MODEL,
                temperature=0
            )
            self.tools = [
                list_all_points, get_point_value, 
                get_fbd_program, get_script, 
                set_point_value,
                create_device, create_point_group, create_point,
                create_script, create_fbd_program, create_hmi_page,
                create_module
            ]
            # Try to bind tools, fallback if model doesn't support it
            try:
                self.llm_with_tools = self.llm.bind_tools(self.tools)
                self.tools_enabled = True
                print(f"DEBUG: Tools bound successfully for {settings.OLLAMA_MODEL}")
            except Exception as e:
                print(f"WARNING: Model {settings.OLLAMA_MODEL} does not natively support tool calling in LangChain/Ollama. Falling back to chat-only mode.")
                self.llm_with_tools = self.llm
                self.tools_enabled = False

            self.workflow = self._build_graph()
            self.app = self.workflow.compile()
            self.ready = True
            print("DEBUG: AIEngine initialized successfully.")
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
        
        if self.tools_enabled:
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
        else:
            workflow.add_edge("agent", END)

        return workflow

    def _call_model(self, state: AgentState):
        messages = state['messages']
        
        # 1. RAG Integration: Fetch context based on the last user message
        last_user_msg = ""
        for msg in reversed(messages):
            if isinstance(msg, HumanMessage):
                last_user_msg = msg.content
                break
        
        # 1a. Core System Summary (Static injection for general awareness)
        context = "SYSTEM OVERVIEW:\n" + self.get_system_summary() + "\n"

        if last_user_msg:
            try:
                print(f"DEBUG: Performing RAG search for: {last_user_msg}")
                vsm = VectorStoreManager()
                # Limit k to reduce embedding/retrieval time
                docs = vsm.search(last_user_msg, k=3)
                if docs:
                    context += "\nSEARCH RESULTS (RAG):\n" + "\n---\n".join([d.page_content for d in docs])
                    print(f"DEBUG: Found {len(docs)} relevant context snippets.")
            except Exception as e:
                print(f"DEBUG: RAG Search failed: {e}")
        
        # 2. Prepend System Prompt and Context
        system_content = SMARTY_SYSTEM_PROMPT
        if context:
            system_content += "\nCURRENT CONTEXT:\n" + context
            
        # Ensure SystemMessage is at the top
        final_messages = [SystemMessage(content=system_content)] + messages
        
        try:
            response = self.llm_with_tools.invoke(final_messages)
        except Exception as e:
            # Catch 400 errors related to tool support mismatch
            if "400" in str(e) and self.tools_enabled:
                print(f"WARNING: Tool invocation failed with 400. Retrying without tools. Error: {e}")
                response = self.llm.invoke(final_messages)
            else:
                raise e
                
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
            yield f"AI Engine is not ready: {self.error_msg}. Please ensure Ollama is running and the model '{settings.OLLAMA_MODEL}' is pulled."
            return

        initial_state = {"messages": history + [HumanMessage(content=user_input)]}

        
        # Using .stream() method of the compiled graph
        for event in self.app.stream(initial_state):
             # event is a dict of node_name -> state_update
             # We want to yield the new token or message content
             for key, value in event.items():
                 if key == "agent":
                     msg = value["messages"][-1]
                     if msg.content:
                         yield msg.content
                 elif key == "tools":
                     # Maybe yield "Processing tools..." or similar status
                     pass
