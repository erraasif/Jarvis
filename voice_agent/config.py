# voice_agent/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class VoiceConfig:
    # LiveKit Server
    LIVEKIT_URL = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
    LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
    LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "secret")
    
    # Speech-to-Text (Deepgram)
    DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")
    
    # Text-to-Speech (ElevenLabs)
    ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
    
    # LLM (Groq)
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    
    # Backend URL
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

voice_config = VoiceConfig()