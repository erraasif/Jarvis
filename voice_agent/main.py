# voice_agent/main.py
"""
JARVIS Voice Agent - LiveKit Implementation
Replaces LangGraph with LiveKit native agent loop
"""

import asyncio
import json
import sys
import os
from pathlib import Path
from datetime import datetime
import pytz

# Add parent directory to path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent))

from livekit import agents
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
from livekit.agents.voice import Agent
from livekit.agents.stt import DeepgramSTT
from livekit.agents.tts import ElevenLabsTTS
from livekit.agents import VAD

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage

# Import the tools (REUSE existing ones)
from app.agent.tools.calendar_tools import (
    get_calendar_events, 
    create_calendar_event, 
    update_calendar_event, 
    delete_calendar_event
)
from app.agent.tools.mail_tools import (
    get_emails, 
    create_email_draft, 
    update_email_draft, 
    delete_email_draft
)
from app.agent.tools.todo_tools import (
    get_todos, 
    create_todo, 
    update_todo, 
    delete_todo
)

# ============================================
# 1. TOOLS MAP (Replaces LangGraph ToolNode)
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
# 2. LLM Setup
# ============================================
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key=os.getenv("GROQ_API_KEY")
)

# ============================================
# 3. System Prompt
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

CORE RULES FOR SEAMLESS AUTONOMOUS EXECUTION:
1. ALWAYS pass user_email='{user_email}' when calling any M365 tools.
2. IMMEDIATE EXECUTION (ZERO CONFIRMATION LOOPS):
   - When the user asks you to perform an action, EXECUTE IT IMMEDIATELY.
   - NEVER ask for confirmation if you already have the essential parameters.
   - Use intelligent defaults for missing optional info.
3. HARD CONSTRAINT ON EMAILS:
   - You can read, draft, or delete email drafts, but NEVER send emails directly.
4. RELATIVE TIME RESOLUTION:
   - Use the Current Date and Time baseline to compute relative references.
5. After executing a tool, reply with a clear, direct summary.
"""

# ============================================
# 4. LIVEKIT AGENT CLASS
# ============================================
class JarvisVoiceAgent(Agent):
    def __init__(self, ctx: JobContext):
        stt = DeepgramSTT(api_key=os.getenv("DEEPGRAM_API_KEY"))
        tts = ElevenLabsTTS(api_key=os.getenv("ELEVENLABS_API_KEY"))
        
        super().__init__(
            ctx=ctx,
            stt=stt,
            tts=tts,
            vad=VAD.DEFAULT,
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
            await self.say("I couldn't identify you. Please sign in and try again.")
            return

        system_content = get_dynamic_system_prompt(self.user_email, self.user_timezone)
        self.messages = [SystemMessage(content=system_content)]
        await self.say(f"Hello! Jarvis is ready. How can I assist you today?")

    async def on_user_utterance(self, utterance: agents.Utterance):
        user_text = utterance.text
        if not user_text:
            return

        self.messages.append(HumanMessage(content=user_text))

        while True:
            llm_with_tools = llm.bind_tools(list(TOOLS_MAP.values()))
            
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(
                None, 
                llm_with_tools.invoke, 
                self.messages
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
                if not func:
                    result = f"Error: Tool '{tool_name}' not found."
                else:
                    try:
                        result = func(**tool_args)
                        if isinstance(result, (dict, list)):
                            result = json.dumps(result)
                        else:
                            result = str(result)
                    except Exception as e:
                        result = f"Error executing {tool_name}: {str(e)}"

                self.messages.append(
                    ToolMessage(content=result, tool_call_id=tool_call["id"])
                )

# ============================================
# 5. ENTRYPOINT
# ============================================
async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    agent = JarvisVoiceAgent(ctx)
    await agent.start()

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))