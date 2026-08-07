# app/api/voice.py
import hashlib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json
import jwt
import time

router = APIRouter(prefix="/api/voice", tags=["Voice"])

class TokenRequest(BaseModel):
    user_email: str
    timezone: str = "UTC"

@router.post("/token")
async def get_voice_token(request: TokenRequest):
    """Generate LiveKit token for frontend to connect"""
    try:
        # Each user gets their own room. A single shared "jarvis-room" would put
        # every concurrent user's voice session in the same call together.
        room_name = "jarvis-" + hashlib.sha256(request.user_email.strip().lower().encode()).hexdigest()[:16]

        # Simple JWT token generation (no livekit.api needed)
        token = jwt.encode(
            {
                "iss": os.getenv("LIVEKIT_API_KEY", "devkey"),
                "exp": int(time.time()) + 3600,
                "nbf": int(time.time()) - 10,
                "sub": request.user_email,
                "video": {
                    "room": room_name,
                    "roomJoin": True,
                    "canPublish": True,
                    "canSubscribe": True
                },
                "metadata": json.dumps({
                    "email": request.user_email,
                    "timezone": request.timezone
                })
            },
            os.getenv("LIVEKIT_API_SECRET", "secret"),
            algorithm="HS256"
        )
        return {"token": token, "room": room_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))