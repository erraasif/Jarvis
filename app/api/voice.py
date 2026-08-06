# app/api/voice.py
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
        # Simple JWT token generation (no livekit.api needed)
        token = jwt.encode(
            {
                "iss": os.getenv("LIVEKIT_API_KEY", "devkey"),
                "exp": int(time.time()) + 3600,
                "nbf": int(time.time()) - 10,
                "sub": request.user_email,
                "video": {
                    "room": "jarvis-room",
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
        return {"token": token}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))