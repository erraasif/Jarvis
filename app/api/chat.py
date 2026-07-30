from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
import os

router = APIRouter(prefix="/api", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    user_email: Optional[EmailStr] = None

class ChatResponse(BaseModel):
    reply: str
    status: str = "success"

@router.post("/chat", response_model=ChatResponse)
async def handle_chat_endpoint(request: ChatRequest):
    try:
        user_message = request.message
        
        # Check if Groq or OpenAI key is present
        api_key = os.environ.get("GROQ_API_KEY") or os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500, 
                detail="No AI API key configured. Please set GROQ_API_KEY in your environment."
            )

        # Here your LangGraph agent or LLM client processes the message.
        # If using Groq client directly or via LangChain/LangGraph:
        from groq import Groq
        client = Groq(api_key=api_key)
        
        completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are Jarvis, an autonomous personal assistant for Microsoft 365. You manage Outlook Mail (drafting only), Calendar, and To-Dos."
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            model="llama-3.3-70b-versatile",
        )
        
        ai_reply = completion.choices[0].message.content
        return ChatResponse(reply=ai_reply)

    except Exception as e:
        # Prevent silent failures by catching and returning explicit details
        error_msg = str(e)
        raise HTTPException(
            status_code=500,
            detail=f"Jarvis Agent Execution Failed: {error_msg}"
        )