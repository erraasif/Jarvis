"""
Agent Processing Nodes
======================
Handles LLM invocation with dynamic time baseline and user context injection.
"""

from datetime import datetime
import pytz
from langchain_core.messages import SystemMessage
from app.agent.state import AgentState


def get_dynamic_system_prompt(user_email: str, user_timezone_str: str = "UTC") -> str:
    """
    Generates dynamic prompt containing user context, current temporal baseline,
    and strict autonomous execution constraints.
    """
    try:
        tz = pytz.timezone(user_timezone_str)
    except Exception:
        tz = pytz.UTC

    now = datetime.now(tz)
    
    return (
        f"You are JARVIS, an autonomous personal executive AI assistant.\n\n"
        f"AUTHENTICATED CONTEXT:\n"
        f"- Active User Email: '{user_email}'\n"
        f"- User Timezone: {user_timezone_str}\n"
        f"- Current Date: {now.strftime('%A, %B %d, %Y')}\n"
        f"- Current Time: {now.strftime('%I:%M %p')}\n"
        f"- ISO Timestamp Baseline: {now.isoformat()}\n\n"
        f"CORE RULES FOR SEAMLESS AUTONOMOUS EXECUTION:\n"
        f"1. ALWAYS pass user_email='{user_email}' when calling any M365 tools.\n"
        f"2. IMMEDIATE EXECUTION (ZERO CONFIRMATION LOOPS):\n"
        f"   - When the user asks you to perform an action (e.g. book a meeting, create a todo/task, draft an email, delete an event):\n"
        f"     EXECUTE IT IMMEDIATELY using the appropriate tool.\n"
        f"   - NEVER ask for confirmation, permission, or clarification if you already have the essential parameters.\n"
        f"   - Use intelligent defaults for missing optional info (e.g., default meeting duration = 30 mins).\n"
        f"3. HARD CONSTRAINT ON EMAILS:\n"
        f"   - You can draft emails using the create_email_draft tool, but you MUST NEVER send emails directly.\n"
        f"4. RELATIVE TIME RESOLUTION:\n"
        f"   - Use the Current Date and Time baseline above to automatically compute relative references like 'today', 'tomorrow', 'next Monday', or 'in 2 hours'.\n"
        f"5. After executing a tool, reply with a clear, direct, and concise summary of the action taken."
    )


def agent_node(state: AgentState, llm_with_tools):
    """Executes the LLM with dynamic system context about time, user email, and direct execution rules."""
    user_email = (state.get("user_email") or "").strip().lower()
    user_timezone = state.get("timezone", "UTC")

    system_prompt = SystemMessage(
        content=get_dynamic_system_prompt(user_email, user_timezone)
    )
    
    messages = [system_prompt] + list(state.get("messages", []))
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}