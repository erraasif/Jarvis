"""
LangGraph Agent Workflow Definition
===================================
Compiles the core JARVIS state graph connecting Groq Llama LLM, 
Microsoft 365 tools, dynamic time context, and state propagation.
"""

from datetime import datetime
import pytz
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage

from app.agent.state import AgentState
from app.agent.tools.mail_tools import get_emails, create_email_draft, update_email_draft, delete_email_draft
from app.agent.tools.calendar_tools import get_calendar_events, create_calendar_event, update_calendar_event, delete_calendar_event
from app.agent.tools.todo_tools import get_todos, create_todo, update_todo, delete_todo

tools = [
    get_emails, create_email_draft, update_email_draft, delete_email_draft,
    get_calendar_events, create_calendar_event, update_calendar_event, delete_calendar_event,
    get_todos, create_todo, update_todo, delete_todo
]

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0
).bind_tools(tools)


def get_dynamic_system_prompt(user_email: str, user_timezone_str: str = "UTC") -> str:
    """
    Generates dynamic system prompt with user identity, real-time date/time baselines,
    and strict autonomous execution directives.
    """
    try:
        tz = pytz.timezone(user_timezone_str)
    except Exception:
        tz = pytz.UTC

    now = datetime.now(tz)
    
    return f"""You are JARVIS, an autonomous personal executive AI assistant.
Your core operating mandate is IMMEDIATE, UNINTERRUPTED EXECUTION.

AUTHENTICATED CONTEXT:
- Active User Email: '{user_email}'
- User Timezone: {user_timezone_str}
- Current Date: {now.strftime('%A, %B %d, %Y')}
- Current Time: {now.strftime('%I:%M %p')}
- ISO Timestamp Baseline: {now.isoformat()}

CORE RULES FOR SEAMLESS AUTONOMOUS EXECUTION:
1. ALWAYS pass user_email='{user_email}' when calling any M365 tools.
2. IMMEDIATE EXECUTION (ZERO CONFIRMATION LOOPS):
   - When the user asks you to perform an action (e.g. book a meeting, create a todo/task, draft an email, delete an event):
     EXECUTE IT IMMEDIATELY using the appropriate tool.
   - NEVER ask for confirmation, permission, or clarification if you already have the essential parameters.
   - Use intelligent defaults for missing optional info (e.g., default meeting duration = 30 mins).
3. HARD CONSTRAINT ON EMAILS:
   - You can read, draft, or delete email drafts using tools, but NEVER claim to send emails directly unless a specific send tool is executed.
4. RELATIVE TIME RESOLUTION:
   - Use the Current Date and Time baseline above to automatically compute relative references like "today", "tomorrow", "next Monday", or "in 2 hours".
5. After executing a tool, reply with a clear, direct, and concise summary of the action taken.
"""


def agent_node(state: AgentState):
    """
    Executes Llama LLM with dynamic time awareness and strict execution directives.
    """
    messages = list(state.get("messages", []))
    user_email = (state.get("user_email") or "").strip().lower()
    user_timezone = state.get("timezone", "UTC")

    # Inject real-time system prompt before conversation history
    system_prompt_content = get_dynamic_system_prompt(user_email, user_timezone)
    system_msg = SystemMessage(content=system_prompt_content)

    messages = [system_msg] + messages

    response = llm.invoke(messages)
    return {"messages": [response]}


def should_continue(state: AgentState):
    """Routes execution to ToolNode if the LLM invoked a tool call."""
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END


# Build StateGraph
workflow = StateGraph(AgentState)

workflow.add_node("agent", agent_node)
workflow.add_node("tools", ToolNode(tools))

workflow.set_entry_point("agent")

# Correct dictionary mapping syntax for conditional edges
workflow.add_conditional_edges(
    "agent", 
    should_continue, 
    {"tools": "tools", END: END}
)
workflow.add_edge("tools", "agent")

jarvis_agent = workflow.compile()