"""
JARVIS Agent Graph Workflow
===========================
Configures the state graph execution loop for the JARVIS autonomous agent.
Handles tool binding, conditional edge routing, and agent state transitions.
"""

from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_groq import ChatGroq

from app.agent.state import AgentState
from app.agent.tools.mail_tools import get_emails, create_email_draft
from app.agent.tools.calendar_tools import (
    get_calendar_events,
    create_calendar_event,
    update_calendar_event,
    delete_calendar_event,
)
from app.agent.tools.todo_tools import (
    get_todos,
    create_todo,
    update_todo,
    delete_todo,
)

# Aggregate all agent capabilities into a unified tool repository
tools = [
    get_emails,
    create_email_draft,
    get_calendar_events,
    create_calendar_event,
    update_calendar_event,
    delete_calendar_event,
    get_todos,
    create_todo,
    update_todo,
    delete_todo,
]

# Initialize LLM with tool-calling capabilities via Groq
llm = ChatGroq(
    model_name="llama-3.3-70b-versatile",
    temperature=0,
).bind_tools(tools)


def agent_node(state: AgentState):
    """
    Processes the current conversation state and invokes the language model.
    
    Args:
        state (AgentState): The current state containing conversation messages.
        
    Returns:
        dict: Updated messages payload with the assistant response.
    """
    response = llm.invoke(state["messages"])
    return {"messages": [response]}


def should_continue(state: AgentState) -> str:
    """
    Determines the next execution path based on the assistant's output.
    
    Args:
        state (AgentState): The current execution state.
        
    Returns:
        str: Next node to execute ("tools" if tool execution requested, END otherwise).
    """
    last_message = state["messages"][-1]
    if getattr(last_message, "tool_calls", None):
        return "tools"
    return END


# Build and compile the execution state graph
workflow = StateGraph(AgentState)

# Add processing nodes
workflow.add_node("agent", agent_node)
workflow.add_node("tools", ToolNode(tools))

# Define execution entry point and conditional edge routing
workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", should_continue, ["tools", END])
workflow.add_edge("tools", "agent")

# Compile into an executable Runnable graph instance
jarvis_agent = workflow.compile()