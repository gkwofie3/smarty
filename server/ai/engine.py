from django.conf import settings
from langchain_community.chat_models import ChatOllama
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, List, Union
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
import operator

# Import our tools
from .tools import (
    list_all_points, get_point_value, 
    get_fbd_program, get_script, 
    set_point_value
)
from .rag import VectorStoreManager

# Define the State
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]
    # We can add more state here like 'context', 'user_id', etc.

class AIEngine:
    def __init__(self):
        self.llm = ChatOllama(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.OLLAMA_MODEL,
            temperature=0  # Deterministic for control systems
        )
        self.tools = [
            list_all_points, get_point_value, 
            get_fbd_program, get_script, 
            set_point_value
        ]
        # Bind tools to LLM
        self.llm_with_tools = self.llm.bind_tools(self.tools)
        self.workflow = self._build_graph()
        self.app = self.workflow.compile()

    def _build_graph(self):
        workflow = StateGraph(AgentState)

        # Define Nodes
        workflow.add_node("agent", self._call_model)
        workflow.add_node("tools", self._call_tool_node) # Verify if we need custom tool node or prebuilt

        # Define Edges
        workflow.set_entry_point("agent")
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
        # Retrieve context from RAG if needed (for simplicity, we let tools handle retrieval or do it here)
        # RAG Integration:
        # last_user_msg = messages[-1].content
        # vsm = VectorStoreManager()
        # docs = vsm.search(last_user_msg)
        # context = "\n".join([d.page_content for d in docs])
        # messages = [SystemMessage(content=f"Context: {context}")] + messages 
        
        response = self.llm_with_tools.invoke(messages)
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
