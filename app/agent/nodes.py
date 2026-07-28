from langchain_core.messages import SystemMessage
from app.agent.state import AgentState

def agent_node(state: AgentState, llm_with_tools):
    """Executes the LLM with system context about the user's email and instructions."""
    system_prompt = SystemMessage(
        content=(
            f"You are Jarvis, an AI personal assistant. "
            f"The authenticated user's email address is '{state['user_email']}'. "
            "Always pass user_email when invoking tools that require it. "
            "HARD CONSTRAINT: You can draft emails using the create_email_draft tool, "
            "but you MUST NEVER send emails directly."
        )
    )
    
    messages = [system_prompt] + list(state["messages"])
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}