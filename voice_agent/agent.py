# voice_agent/agent.py
"""
JARVIS Voice Agent
===================
Built on LiveKit's AgentSession framework (livekit-agents >= 1.0).

Architecture:
  JobContext -> AgentSession (owns the STT -> LLM -> TTS pipeline + VAD)
             -> Agent (instructions + per-user tools, built once we know
                        which authenticated user connected)

The Microsoft Graph tools are the same LangChain @tool-decorated functions
used by the text agent (app/agent/tools/*) -- we call their underlying
`.func` directly rather than going through LangChain's tool-calling layer,
and expose them to LiveKit via @function_tool wrappers instead.
"""
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

import pytz
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent.parent))

from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    RoomInputOptions,
    RunContext,
    WorkerOptions,
    cli,
    function_tool,
)
from livekit.plugins import deepgram, elevenlabs, silero, groq as lk_groq

from app.agent.tools.calendar_tools import (
    get_calendar_events,
    create_calendar_event,
    update_calendar_event,
    delete_calendar_event,
)
from app.agent.tools.mail_tools import (
    get_emails,
    create_email_draft,
    update_email_draft,
    delete_email_draft,
)
from app.agent.tools.todo_tools import (
    get_todos,
    create_todo,
    update_todo,
    delete_todo,
)

load_dotenv()
logger = logging.getLogger("jarvis-voice-agent")


def _run(tool, **kwargs):
    """
    Call the real function behind a LangChain @tool decorator (`.func`),
    bypassing BaseTool.__call__, which only accepts a single positional
    string argument in current LangChain versions and raises a TypeError
    if called with multiple keyword arguments directly.
    """
    result = tool.func(**kwargs)
    return json.dumps(result) if isinstance(result, (dict, list)) else str(result)


def get_dynamic_system_prompt(user_email: str, user_timezone: str) -> str:
    try:
        tz = pytz.timezone(user_timezone)
    except Exception:
        tz = pytz.UTC
    now = datetime.now(tz)
    return f"""You are JARVIS, an autonomous executive assistant speaking with the user over voice.

Speak like a person, not a chat window: short, direct, conversational sentences.
Never read out markdown, bullet points, or IDs unless the user explicitly asks for one.

AUTHENTICATED CONTEXT:
- Active User Email: {user_email}
- User Timezone: {user_timezone}
- Current Date: {now.strftime('%A, %B %d, %Y')}
- Current Time: {now.strftime('%I:%M %p')}

CORE RULES:
1. Execute requests immediately. Never ask for confirmation if you already have what you need.
2. Never send an email directly -- only create, edit, or delete drafts.
3. Resolve relative dates and times ("tomorrow", "next week") against the current date/time above.
4. After any tool call, summarize the result in one short spoken sentence."""


def build_tools(user_email: str):
    """
    Build the set of voice-callable tools for one authenticated session.
    user_email is captured in a closure rather than exposed as an
    LLM-controllable argument, since it comes from the authenticated
    session, not from anything the user says.
    """

    @function_tool()
    async def list_recent_emails(context: RunContext, count: int = 5) -> str:
        """Get the user's most recent emails.

        Args:
            count: how many recent emails to fetch.
        """
        return _run(get_emails, user_email=user_email, top=count)

    @function_tool()
    async def draft_email(context: RunContext, recipient: str, subject: str, body: str) -> str:
        """Create a draft email in Outlook. This never sends the email.

        Args:
            recipient: the recipient's email address.
            subject: the email subject line.
            body: the email body text.
        """
        return _run(create_email_draft, user_email=user_email, recipient=recipient, subject=subject, body=body)

    @function_tool()
    async def edit_email_draft(
        context: RunContext, email_id: str, subject: Optional[str] = None, body: Optional[str] = None
    ) -> str:
        """Edit an existing draft's subject and/or body. Only works on drafts, not sent mail.

        Args:
            email_id: the Graph API id of the draft to edit.
            subject: new subject line, if changing it.
            body: new body text, if changing it.
        """
        return _run(update_email_draft, user_email=user_email, email_id=email_id, subject=subject, body=body)

    @function_tool()
    async def delete_email(context: RunContext, email_id: str) -> str:
        """Delete a draft email by id.

        Args:
            email_id: the Graph API id of the draft to delete.
        """
        return _run(delete_email_draft, user_email=user_email, email_id=email_id)

    @function_tool()
    async def list_calendar_events(context: RunContext, count: int = 10) -> str:
        """Get the user's upcoming calendar events.

        Args:
            count: how many upcoming events to fetch.
        """
        return _run(get_calendar_events, user_email=user_email, top=count)

    @function_tool()
    async def create_event(
        context: RunContext,
        subject: str,
        start_time: str,
        end_time: Optional[str] = None,
        timezone: str = "UTC",
        location: Optional[str] = None,
    ) -> str:
        """Create a calendar event.

        Args:
            subject: title of the meeting or event.
            start_time: ISO timestamp without offset, e.g. '2026-08-01T15:00:00'.
            end_time: ISO timestamp for the end. Defaults to 30 minutes after start_time.
            timezone: IANA timezone, e.g. 'Asia/Karachi'.
            location: optional location or meeting link.
        """
        return _run(
            create_calendar_event,
            user_email=user_email,
            subject=subject,
            start_time=start_time,
            end_time=end_time,
            user_timezone=timezone,
            location=location,
        )

    @function_tool()
    async def edit_event(
        context: RunContext,
        event_id: str,
        subject: Optional[str] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        timezone: str = "UTC",
        location: Optional[str] = None,
    ) -> str:
        """Edit an existing calendar event.

        Args:
            event_id: the Graph API id of the event to edit.
            subject: new subject, if changing it.
            start_time: new start ISO timestamp, if changing it.
            end_time: new end ISO timestamp, if changing it.
            timezone: IANA timezone for the updated times.
            location: new location, if changing it.
        """
        return _run(
            update_calendar_event,
            user_email=user_email,
            event_id=event_id,
            subject=subject,
            start_time=start_time,
            end_time=end_time,
            user_timezone=timezone,
            location=location,
        )

    @function_tool()
    async def delete_event(context: RunContext, event_id: str) -> str:
        """Delete a calendar event by id.

        Args:
            event_id: the Graph API id of the event to delete.
        """
        return _run(delete_calendar_event, user_email=user_email, event_id=event_id)

    @function_tool()
    async def list_todos(context: RunContext) -> str:
        """Get the user's Microsoft To-Do tasks."""
        return _run(get_todos, user_email=user_email)

    @function_tool()
    async def add_todo(context: RunContext, title: str, due_date_time: Optional[str] = None, timezone: str = "UTC") -> str:
        """Add a new to-do task.

        Args:
            title: the task's title.
            due_date_time: optional due ISO timestamp.
            timezone: IANA timezone for the due date.
        """
        return _run(create_todo, user_email=user_email, title=title, due_date_time=due_date_time, user_timezone=timezone)

    @function_tool()
    async def update_todo_status(
        context: RunContext, task_id: str, status: str = "completed", title: Optional[str] = None
    ) -> str:
        """Update a to-do task's status or title.

        Args:
            task_id: the Graph API id of the task.
            status: one of 'notStarted', 'inProgress', or 'completed'.
            title: new title, if changing it.
        """
        return _run(update_todo, user_email=user_email, task_id=task_id, status=status, title=title)

    @function_tool()
    async def delete_todo_item(context: RunContext, task_id: str) -> str:
        """Delete a to-do task by id.

        Args:
            task_id: the Graph API id of the task to delete.
        """
        return _run(delete_todo, user_email=user_email, task_id=task_id)

    return [
        list_recent_emails,
        draft_email,
        edit_email_draft,
        delete_email,
        list_calendar_events,
        create_event,
        edit_event,
        delete_event,
        list_todos,
        add_todo,
        update_todo_status,
        delete_todo_item,
    ]


def _groq_llm():
    return lk_groq.LLM(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
    )


async def entrypoint(ctx: JobContext):
    await ctx.connect()

    # Wait for the authenticated participant and read the email/timezone
    # the backend embedded in their token metadata (see app/api/voice.py).
    participant = await ctx.wait_for_participant()
    logger.info("participant joined: identity=%s metadata=%r", participant.identity, participant.metadata)
    user_email = None
    user_timezone = "UTC"
    if participant.metadata:
        try:
            metadata = json.loads(participant.metadata)
            user_email = metadata.get("email")
            user_timezone = metadata.get("timezone", "UTC")
        except (json.JSONDecodeError, TypeError):
            logger.warning("Could not parse participant metadata: %r", participant.metadata)
    logger.info("resolved user_email=%r user_timezone=%r", user_email, user_timezone)

    session = AgentSession(
        stt=deepgram.STT(api_key=os.getenv("DEEPGRAM_API_KEY")),
        llm=_groq_llm(),
        tts=elevenlabs.TTS(api_key=os.getenv("ELEVENLABS_API_KEY")),
        vad=silero.VAD.load(),
    )

    if not user_email:
        agent = Agent(instructions="Tell the user you couldn't identify their account and ask them to sign in again.")
        await session.start(room=ctx.room, agent=agent, room_input_options=RoomInputOptions())
        await session.generate_reply(instructions="Apologize and say you couldn't identify the signed-in account.")
        return

    agent = Agent(
        instructions=get_dynamic_system_prompt(user_email, user_timezone),
        tools=build_tools(user_email),
    )

    session.on("user_state_changed", lambda ev: logger.info("user_state_changed: %s", ev.new_state))
    session.on("agent_state_changed", lambda ev: logger.info("agent_state_changed: %s", ev.new_state))
    session.on("user_input_transcribed", lambda ev: logger.info("transcribed (final=%s): %r", ev.is_final, ev.transcript))
    session.on("error", lambda ev: logger.error("session error: %s", ev.error))

    await session.start(room=ctx.room, agent=agent, room_input_options=RoomInputOptions())
    await session.generate_reply(instructions="Greet the user briefly as Jarvis and ask how you can help.")


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))