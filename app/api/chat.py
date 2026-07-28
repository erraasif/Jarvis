from fastapi import APIRouter
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from app.agent.graph import jarvis_agent

router = APIRouter(prefix="/chat", tags=["Jarvis Chat"])

class ChatRequest(BaseModel):
    user_email: str
    message: str

@router.post("")
def chat_with_jarvis(req: ChatRequest):
    initial_state = {
        "messages": [HumanMessage(content=f"User Email: {req.user_email}\nMessage: {req.message}")],
        "user_email": req.user_email
    }
    result = jarvis_agent.invoke(initial_state)
    return {"reply": result["messages"][-1].content}