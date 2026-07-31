"""
JARVIS Agent Graph Workflow
===========================
Configures the state graph execution loop for the JARVIS autonomous agent.
Handles temporal system prompt construction, tool binding, conditional edge routing, 
and state transitions.
"""

import datetime
import zoneinfo
from langchain_core.messages import SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_groq import ChatGroq

from app.agent.state import AgentState
from app.agent.tools.mail_tools import (
    get_emails,
    get_unread_emails,
    create_email_draft,
    create_reply_draft,
    delete_email
)
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

# Aggregate all agent capabilities into a unified tool list
tools = [
    get_emails,
    get_unread_emails,
    create_email_draft,
    create_reply_draft,
    delete_email,
    get_calendar_events,
    create_calendar_event,
    update_calendar_event,
    delete_calendar_event,
    get_todos,
    create_todo,
    update_todo,
    delete_todo,
]

# Initialize LLM with bound tools via Groq
llm = ChatGroq(
    model_name="llama-3.3-70b-versatile",
    temperature=0,
).bind_tools(tools)


def build_system_message(user_timezone_str: str = "UTC") -> SystemMessage:
    """Dynamically builds temporal grounding for relative date resolution."""
    try:
        tz = zoneinfo.ZoneInfo(user_timezone_str)
    except Exception:
        tz = zoneinfo.ZoneInfo("UTC")

    now = datetime.datetime.now(tz)
    today_str = now.strftime("%Y-%m-%d")
    tomorrow_str = (now + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
    current_time_readable = now.strftime("%A, %B %d, %Y at %I:%M:%S %p %Z")

    prompt_text = f"""You are JARVIS, an autonomous executive AI assistant integrated with Microsoft 365 (Calendar, Mail, and To-Do).

REAL-TIME TEMPORAL CONTEXT:
- Current Time & Date: {current_time_readable}
- User Timezone: {user_timezone_str}
- Today's Date: {today_str}
- Tomorrow's Date: {tomorrow_str}

AUTONOMOUS EXECUTION DIRECTIVES:
1. BIAS FOR ACTION: Execute user requests immediately using available tools. Do NOT ask for permission or unnecessary confirmation.
2. TIME & DATES: Convert relative references ("tomorrow at 3pm", "next Monday") into exact ISO timestamps based on temporal context above.
3. SMART ASSUMPTIONS:
   - Default meeting duration: 30 minutes.
   - Default email action: Save as DRAFT in Outlook. NEVER send emails automatically.
   - Default task target: User's default To-Do list.
4. RESPONSE FORMAT: Keep responses concise, direct, and confirmation-focused.
"""
    return SystemMessage(content=prompt_text)


def agent_node(state: AgentState):
    """
    Processes the conversation state, injects dynamic temporal prompt, 
    and invokes the language model.
    """
    user_tz = state.get("user_timezone", "UTC")
    system_msg = build_system_message(user_tz)

    # Prepend SystemMessage to messages array if not already present
    messages = state["messages"]
    if not messages or not isinstance(messages[0], SystemMessage):
        messages = [system_msg] + messages

    response = llm.invoke(messages)
    return {"messages": [response]}


def should_continue(state: AgentState) -> str:
    """Determines whether to execute tools or end execution loop."""
    last_message = state["messages"][-1]
    if getattr(last_message, "tool_calls", None):
        return "tools"
    return END


# Build and compile execution state graph
workflow = StateGraph(AgentState)

workflow.add_node("agent", agent_node)
workflow.add_node("tools", ToolNode(tools))

workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", should_continue, ["tools", END])
workflow.add_edge("tools", "agent")

jarvis_agent = workflow.compile()