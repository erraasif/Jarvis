# app/api/voice.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from livekit import api
import os
import json

router = APIRouter(prefix="/api/voice", tags=["Voice"])

class TokenRequest(BaseModel):
    user_email: str
    timezone: str = "UTC"

@router.post("/token")
async def get_voice_token(request: TokenRequest):
    """Generate LiveKit token for frontend to connect"""
    try:
        token = api.AccessToken(
            os.getenv("LIVEKIT_API_KEY", "devkey"),
            os.getenv("LIVEKIT_API_SECRET", "secret")
        ).with_identity(request.user_email) \
         .with_metadata(json.dumps({
             "email": request.user_email,
             "timezone": request.timezone
         })) \
         .with_name("Jarvis User") \
         .to_jwt()
        
        return {"token": token}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))