"""
Chat Router Endpoints
====================
Provides HTTP REST and Server-Sent Events (SSE) streaming routes for
interacting with the JARVIS autonomous agent and accessing historical logs,
organized into real, switchable conversation sessions.
"""

import logging
import traceback
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import anyio
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.agent.graph import jarvis_agent
from app.services.supabase_client import (
    save_chat_message, get_chat_history, get_chat_sessions, delete_chat_session,
    ensure_chat_session, rename_chat_session, set_session_pinned,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Jarvis Chat"])

HISTORY_TURNS_TO_INCLUDE = 30


class ChatRequest(BaseModel):
    """Payload schema for chat interactions."""
    user_email: EmailStr
    message: str
    timezone: str = "UTC"  # IANA timezone string, e.g. 'Asia/Karachi'
    session_id: str        # which conversation this message belongs to


class ChatResponse(BaseModel):
    """Payload schema for single-turn chat responses."""
    reply: str


def build_system_prompt(timezone: str, user_email: str) -> str:
    """Gives the agent the current date/time in the user's real timezone,
    the actual authenticated user's email, and behavior rules — most
    importantly, to act on requests directly instead of repeatedly asking
    for confirmation, and to never invent a placeholder email."""
    try:
        tz = ZoneInfo(timezone)
    except (ZoneInfoNotFoundError, TypeError, ValueError):
        tz = ZoneInfo("UTC")
        timezone = "UTC"

    now = datetime.now(tz)
    now_str = now.strftime("%A, %B %d, %Y, %H:%M")
    offset = now.strftime("%z")
    offset_fmt = f"{offset[:3]}:{offset[3:]}" if offset else "+00:00"

    return f"""You are Jarvis, an autonomous personal assistant for Microsoft 365 (Mail, Calendar, To-Do).

AUTHENTICATED USER: {user_email}
Every tool you call takes a `user_email` parameter — always pass exactly
"{user_email}" for it. Never use a placeholder, example, or any other email
address for that parameter under any circumstance.

CURRENT DATE & TIME: {now_str} ({timezone}, UTC{offset_fmt})
Use this as "now" for anything relative the user says — "today", "tomorrow",
"next Monday", "in an hour", "at 3pm" — and resolve it to an absolute local
datetime (no offset, e.g. "2026-08-02T15:00:00") plus the timezone name
{timezone} before calling any calendar tool.

BEHAVIOR:
- Act directly. When the user asks you to do something (book a meeting, add a
  task, draft an email, delete an event) and you have enough information to
  do it, call the tool immediately — do not ask "should I go ahead?" or
  repeat the request back for confirmation first. Just do it, then report
  what you did in one short summary.
- Only ask a clarifying question when a genuinely required detail is missing
  and cannot be reasonably inferred (e.g. no time was given at all for an
  event). Ask once, specifically, then act on the answer — don't re-confirm
  after that.
- Never send email. Mail actions are drafts only — this is a hard rule.
- Keep replies concise and conversational. Use markdown (lists, bold) where
  it aids clarity, not for its own sake.
"""


def build_initial_state(req: ChatRequest) -> dict:
    """
    Retrieves historical context and constructs the state dict expected
    by the AgentState schema in LangGraph.
    """
    system_prompt = build_system_prompt(req.timezone or "UTC", req.user_email)
    past_turns = get_chat_history(req.user_email, req.session_id, limit=HISTORY_TURNS_TO_INCLUDE)

    history_messages = [
        HumanMessage(content=h["content"]) if h["role"] == "user" else AIMessage(content=h["content"])
        for h in past_turns
    ]

    return {
        "messages": [SystemMessage(content=system_prompt), *history_messages, HumanMessage(content=req.message)],
        "user_email": str(req.user_email),
        "timezone": req.timezone or "UTC",
    }


def friendly_error(err_text: str) -> str:
    """Helper to convert raw tracebacks to user-friendly messages."""
    if "Incorrect API key" in err_text or "invalid_api_key" in err_text or "AuthenticationError" in err_text:
        return "JARVIS cannot connect to the LLM backend — invalid or missing API credentials (check GROQ_API_KEY)."
    if "insufficient_quota" in err_text or "rate_limit" in err_text.lower() or "quota" in err_text.lower():
        return "JARVIS AI capacity limit reached — API rate limit/quota exceeded."
    return f"JARVIS encountered an execution error: {err_text[:200]}"


@router.get("/sessions")
def list_sessions(user_email: EmailStr):
    """Lists this user's past conversations (id, title, last activity, pin state)."""
    try:
        return {"sessions": get_chat_sessions(user_email)}
    except Exception as e:
        logger.error(f"Failed to fetch sessions for {user_email}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to retrieve sessions.")


@router.get("/history")
def chat_history(user_email: EmailStr, session_id: str):
    """Retrieves the messages within one specific conversation session."""
    try:
        history = get_chat_history(user_email, session_id)
        return {"history": history}
    except Exception as e:
        logger.error(f"Failed to fetch history for {user_email}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to retrieve chat history.")


@router.delete("/sessions/{session_id}")
def remove_session(session_id: str, user_email: EmailStr):
    """Deletes a chat session by ID."""
    delete_chat_session(user_email, session_id)
    return {"status": "deleted"}


class RenameRequest(BaseModel):
    user_email: EmailStr
    title: str


@router.patch("/sessions/{session_id}")
def rename_session(session_id: str, req: RenameRequest):
    """Renames an existing chat session."""
    rename_chat_session(req.user_email, session_id, req.title)
    return {"status": "renamed"}


class PinRequest(BaseModel):
    user_email: EmailStr
    is_pinned: bool


@router.patch("/sessions/{session_id}/pin")
def pin_session(session_id: str, req: PinRequest):
    """Pins or unpins a chat session — persisted, not just local UI state."""
    set_session_pinned(req.user_email, session_id, req.is_pinned)
    return {"status": "pinned" if req.is_pinned else "unpinned"}


@router.post("", response_model=ChatResponse)
def chat_with_jarvis(req: ChatRequest):
    """Handles synchronous non-streaming chat requests."""
    initial_state = build_initial_state(req)

    try:
        result = jarvis_agent.invoke(initial_state)
        reply = result["messages"][-1].content

        try:
            ensure_chat_session(req.user_email, req.session_id, title_hint=req.message)
            save_chat_message(req.user_email, "user", req.message, req.session_id)
            save_chat_message(req.user_email, "assistant", reply, req.session_id)
        except Exception as db_err:
            logger.warning(f"Failed to persist chat message: {db_err}")

        return ChatResponse(reply=reply)

    except Exception as e:
        logger.error(f"Error during agent invocation: {e}")
        traceback.print_exc()
        return ChatResponse(reply=friendly_error(str(e)))


@router.post("/stream")
async def chat_stream_with_jarvis(req: ChatRequest):
    """Streams the response token-by-token over Server-Sent Events."""
    initial_state = build_initial_state(req)

    async def event_generator():
        full_reply = ""

        try:
            await anyio.to_thread.run_sync(ensure_chat_session, req.user_email, req.session_id, req.message)
            await anyio.to_thread.run_sync(save_chat_message, req.user_email, "user", req.message, req.session_id)
        except Exception as db_err:
            logger.warning(f"Failed to persist streaming user prompt: {db_err}")

        try:
            async for event in jarvis_agent.astream_events(initial_state, version="v2"):
                if event["event"] == "on_chat_model_stream":
                    chunk_content = event["data"]["chunk"].content
                    if chunk_content:
                        if isinstance(chunk_content, str):
                            text_chunk = chunk_content
                        elif isinstance(chunk_content, list):
                            text_chunk = "".join([c.get("text", "") for c in chunk_content if isinstance(c, dict)])
                        else:
                            text_chunk = str(chunk_content)

                        if text_chunk:
                            full_reply += text_chunk
                            sanitized_chunk = text_chunk.replace("\n", "\\n")
                            yield f"data: {sanitized_chunk}\n\n"

            if full_reply:
                try:
                    await anyio.to_thread.run_sync(save_chat_message, req.user_email, "assistant", full_reply, req.session_id)
                except Exception as db_err:
                    logger.warning(f"Failed to persist assistant stream response: {db_err}")

        except Exception as e:
            logger.error(f"Streaming error encountered: {e}")
            yield f"data: {friendly_error(str(e))}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")