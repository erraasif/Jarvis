# voice_agent/agent.py
import asyncio
import json
import sys
from pathlib import Path

# Add parent directory to import app
sys.path.insert(0, str(Path(__file__).parent.parent))

from livekit import agents
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
from livekit.agents.voice import Agent
from livekit.agents.stt import DeepgramSTT
from livekit.agents.tts import ElevenLabsTTS
from livekit.agents import VAD
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
import os

# Import tools
from app.agent.tools.calendar_tools import (
    get_calendar_events, create_calendar_event, update_calendar_event, delete_calendar_event
)
from app.agent.tools.mail_tools import (
    get_emails, create_email_draft, update_email_draft, delete_email_draft
)
from app.agent.tools.todo_tools import (
    get_todos, create_todo, update_todo, delete_todo
)

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

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=os.getenv("GROQ_API_KEY"))

class JarvisVoiceAgent(Agent):
    def __init__(self, ctx: JobContext):
        super().__init__(
            ctx=ctx,
            stt=DeepgramSTT(api_key=os.getenv("DEEPGRAM_API_KEY")),
            tts=ElevenLabsTTS(api_key=os.getenv("ELEVENLABS_API_KEY")),
            vad=VAD.DEFAULT,
        )
        self.user_email = None
        self.messages = []

    async def on_enter(self):
        participant = self.ctx.room.local_participant
        if participant.metadata:
            try:
                metadata = json.loads(participant.metadata)
                self.user_email = metadata.get("email")
            except:
                pass

        if not self.user_email:
            await self.say("Please sign in.")
            return

        self.messages = [SystemMessage(content=f"You are Jarvis. User: {self.user_email}")]
        await self.say("Jarvis ready!")

    async def on_user_utterance(self, utterance: agents.Utterance):
        user_text = utterance.text
        if not user_text:
            return

        self.messages.append(HumanMessage(content=user_text))

        while True:
            llm_with_tools = llm.bind_tools(list(TOOLS_MAP.values()))
            response = await asyncio.get_running_loop().run_in_executor(None, llm_with_tools.invoke, self.messages)
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

                self.messages.append(ToolMessage(content=result, tool_call_id=tool_call["id"]))

async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    agent = JarvisVoiceAgent(ctx)
    await agent.start()

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))