"""
Chat Router Endpoints
====================
Provides HTTP REST and Server-Sent Events (SSE) streaming routes for 
interacting with the JARVIS autonomous agent and accessing historical logs.
"""

import logging
import traceback
import anyio
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from langchain_core.messages import HumanMessage

from app.agent.graph import jarvis_agent
from app.services.supabase_client import save_chat_message, get_chat_history

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Jarvis Chat"])


class ChatRequest(BaseModel):
    """Payload schema for chat interactions."""
    user_email: EmailStr
    message: str


class ChatResponse(BaseModel):
    """Payload schema for single-turn chat responses."""
    reply: str


@router.get("/history")
def chat_history(user_email: EmailStr):
    """
    Retrieves historical chat conversations for a given user email.
    
    Args:
        user_email (EmailStr): User identifier for filtering history logs.
        
    Returns:
        dict: List of previous conversation messages.
    """
    try:
        history = get_chat_history(user_email)
        return {"history": history}
    except Exception as e:
        logger.error(f"Failed to fetch history for {user_email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve chat history."
        )


@router.post("", response_model=ChatResponse)
def chat_with_jarvis(req: ChatRequest):
    """
    Handles synchronous non-streaming chat requests. Invokes the JARVIS state graph 
    and persists conversation logs asynchronously.
    """
    initial_state = {
        "messages": [HumanMessage(content=f"User Email: {req.user_email}\nMessage: {req.message}")],
        "user_email": req.user_email
    }

    try:
        # Execute agent workflow synchronously
        result = jarvis_agent.invoke(initial_state)
        reply = result["messages"][-1].content

        # Best-effort log persistence
        try:
            save_chat_message(req.user_email, "user", req.message)
            save_chat_message(req.user_email, "assistant", reply)
        except Exception as db_err:
            logger.warning(f"Failed to persist chat message: {db_err}")

        return ChatResponse(reply=reply)

    except Exception as e:
        logger.error(f"Error during agent invocation: {e}")
        traceback.print_exc()
        
        err_text = str(e)
        if "Incorrect API key" in err_text or "invalid_api_key" in err_text:
            friendly = "JARVIS cannot connect to the LLM backend — invalid or missing API credentials."
        elif "insufficient_quota" in err_text or "quota" in err_text.lower():
            friendly = "JARVIS AI capacity limit reached — API rate limit/quota exceeded."
        else:
            friendly = f"JARVIS encountered an execution error: {err_text[:200]}"

        return ChatResponse(reply=friendly)


@router.post("/stream")
async def chat_stream_with_jarvis(req: ChatRequest):
    """
    Handles real-time streaming chat responses using Server-Sent Events (SSE).
    Accumulates response tokens and persists interaction logs upon stream completion.
    """
    initial_state = {
        "messages": [HumanMessage(content=f"User Email: {req.user_email}\nMessage: {req.message}")],
        "user_email": req.user_email
    }

    async def event_generator():
        full_reply = ""
        
        # Persist initial user query safely without blocking stream thread
        try:
            await anyio.to_thread.run_sync(save_chat_message, req.user_email, "user", req.message)
        except Exception as db_err:
            logger.warning(f"Failed to persist streaming user prompt: {db_err}")

        try:
            # Stream execution events from LangGraph workflow
            async for event in jarvis_agent.astream_events(initial_state, version="v2"):
                if event["event"] == "on_chat_model_stream":
                    chunk_content = event["data"]["chunk"].content
                    if chunk_content:
                        # Normalize content type (handles string, dicts, or lists)
                        if isinstance(chunk_content, str):
                            text_chunk = chunk_content
                        elif isinstance(chunk_content, list):
                            text_chunk = "".join([c.get("text", "") for c in chunk_content if isinstance(c, dict)])
                        else:
                            text_chunk = str(chunk_content)

                        if text_chunk:
                            full_reply += text_chunk
                            # Escape raw newlines for SSE format compliance
                            sanitized_chunk = text_chunk.replace("\n", "\\n")
                            yield f"data: {sanitized_chunk}\n\n"

            # Persist assistant reply after stream finishes
            if full_reply:
                try:
                    await anyio.to_thread.run_sync(save_chat_message, req.user_email, "assistant", full_reply)
                except Exception as db_err:
                    logger.warning(f"Failed to persist assistant stream response: {db_err}")

        except Exception as e:
            logger.error(f"Streaming error encountered: {e}")
            yield f"data: JARVIS stream interrupted due to error: {str(e)[:150]}\n\n"

        # Signal completion to frontend SSE listener
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")