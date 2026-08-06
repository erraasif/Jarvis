# voice_agent/agent.py
import asyncio
import json
import sys
from pathlib import Path
from datetime import datetime
import pytz
import os

# Add parent directory to Python path
parent_dir = str(Path(__file__).parent.parent)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Import tools from app
from app.agent.tools.calendar_tools import (
    get_calendar_events, create_calendar_event, update_calendar_event, delete_calendar_event
)
from app.agent.tools.mail_tools import (
    get_emails, create_email_draft, update_email_draft, delete_email_draft
)
from app.agent.tools.todo_tools import (
    get_todos, create_todo, update_todo, delete_todo
)

# LiveKit imports
from livekit import agents
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
from livekit.agents.voice import Agent
from livekit.agents import vad
from livekit.agents import deepgram, elevenlabs

# LangChain imports
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage

# ============================================
# TOOLS MAP
# ============================================
TOOLS_MAP = {
    "get_calendar_events": get_calendar_events,
    "create_calendar_event": create_calendar_event,
    "update_calendar_event": update_calendar_event,
    "delete_calendar_event": delete_calendar_event,
    "get_emails": get_emails,
    "create_email_draft": create_email_draft,
    "update_email_draft": update_email_draft,
    "delete_email_draft": delete_email_draft,
    "get_todos": get_todos,
    "create_todo": create_todo,
    "update_todo": update_todo,
    "delete_todo": delete_todo,
}

# ============================================
# LLM SETUP
# ============================================
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key=os.getenv("GROQ_API_KEY")
)

# ============================================
# SYSTEM PROMPT
# ============================================
def get_dynamic_system_prompt(user_email: str, user_timezone: str = "UTC") -> str:
    try:
        tz = pytz.timezone(user_timezone)
    except Exception:
        tz = pytz.UTC
    now = datetime.now(tz)
    return f"""You are JARVIS, an autonomous personal executive AI assistant.
Your core operating mandate is IMMEDIATE, UNINTERRUPTED EXECUTION.

AUTHENTICATED CONTEXT:
- Active User Email: '{user_email}'
- User Timezone: {user_timezone}
- Current Date: {now.strftime('%A, %B %d, %Y')}
- Current Time: {now.strftime('%I:%M %p')}
- ISO Timestamp Baseline: {now.isoformat()}

CORE RULES:
1. ALWAYS pass user_email='{user_email}' when calling any M365 tools.
2. IMMEDIATE EXECUTION - NEVER ask for confirmation.
3. HARD CONSTRAINT: NEVER send emails directly - only create drafts.
4. Use current date/time for relative references.
5. After executing a tool, reply with a clear summary.
"""

# ============================================
# AGENT CLASS
# ============================================
class JarvisVoiceAgent(Agent):
    def __init__(self, ctx: JobContext):
        super().__init__(
            ctx=ctx,
            stt=deepgram.STT(api_key=os.getenv("DEEPGRAM_API_KEY")),
            tts=elevenlabs.TTS(api_key=os.getenv("ELEVENLABS_API_KEY")),
            vad=vad.DEFAULT,
        )
        self.user_email = None
        self.user_timezone = "UTC"
        self.messages = []

    async def on_enter(self):
        participant = self.ctx.room.local_participant
        if participant.metadata:
            try:
                metadata = json.loads(participant.metadata)
                self.user_email = metadata.get("email")
                self.user_timezone = metadata.get("timezone", "UTC")
            except:
                pass

        if not self.user_email:
            await self.say("Please sign in.")
            return

        system_content = get_dynamic_system_prompt(self.user_email, self.user_timezone)
        self.messages = [SystemMessage(content=system_content)]
        await self.say("Jarvis ready!")

    async def on_user_utterance(self, utterance: agents.Utterance):
        user_text = utterance.text
        if not user_text:
            return

        self.messages.append(HumanMessage(content=user_text))

        while True:
            llm_with_tools = llm.bind_tools(list(TOOLS_MAP.values()))
            response = await asyncio.get_running_loop().run_in_executor(
                None, llm_with_tools.invoke, self.messages
            )
            self.messages.append(response)

            if not response.tool_calls:
                await self.say(response.content)
                return

            for tool_call in response.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                tool_args["user_email"] = self.user_email
                
                func = TOOLS_MAP.get(tool_name)
                if func:
                    try:
                        result = func(**tool_args)
                        if isinstance(result, (dict, list)):
                            result = json.dumps(result)
                        else:
                            result = str(result)
                    except Exception as e:
                        result = f"Error: {str(e)}"
                else:
                    result = f"Tool {tool_name} not found"

                self.messages.append(
                    ToolMessage(content=result, tool_call_id=tool_call["id"])
                )

# ============================================
# ENTRYPOINT
# ============================================
async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    agent = JarvisVoiceAgent(ctx)
    await agent.start()

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))