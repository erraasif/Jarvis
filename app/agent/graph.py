from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_openai import ChatOpenAI
from app.agent.state import AgentState
from app.agent.tools.mail_tools import get_emails, create_email_draft, update_email_draft, delete_email_draft
from app.agent.tools.calendar_tools import get_calendar_events, create_calendar_event, update_calendar_event, delete_calendar_event
from app.agent.tools.todo_tools import get_todos, create_todo, update_todo, delete_todo

tools = [
    get_emails, create_email_draft, update_email_draft, delete_email_draft,
    get_calendar_events, create_calendar_event, update_calendar_event, delete_calendar_event,
    get_todos, create_todo, update_todo, delete_todo
]

llm = ChatOpenAI(model="gpt-4o", temperature=0).bind_tools(tools)

def agent_node(state: AgentState):
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

def should_continue(state: AgentState):
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tools"
    return END

workflow = StateGraph(AgentState)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", ToolNode(tools))

workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", should_continue, ["tools", END])
workflow.add_edge("tools", "agent")

jarvis_agent = workflow.compile()