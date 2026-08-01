"""
Supabase Client Service
======================
Manages user authentication tokens (with Fernet encryption/decryption) 
and persists chat history logs.
"""

from datetime import datetime, timezone, timedelta
from supabase import create_client, Client
from cryptography.fernet import Fernet
from app.config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
fernet = Fernet(settings.TOKEN_ENCRYPTION_KEY.encode())


def encrypt_token(token: str) -> str:
    if not token:
        return ""
    return fernet.encrypt(token.encode()).decode()


def decrypt_token(encrypted_token: str) -> str:
    if not encrypted_token:
        return ""
    return fernet.decrypt(encrypted_token.encode()).decode()


def save_user_tokens(email: str, access_token: str, refresh_token: str, expires_in: int):
    """
    Persists user tokens into Supabase. 
    Stores expires_at as an ISO 8601 string for Postgres TIMESTAMPTZ compatibility.
    """
    encrypted_access = encrypt_token(access_token)
    encrypted_refresh = encrypt_token(refresh_token) if refresh_token else None
    
    # Calculate target expiration as an ISO 8601 timestamp in UTC
    expires_at = (datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))).isoformat()
    
    data = {
        "email": email,
        "access_token": encrypted_access,
        "refresh_token": encrypted_refresh,
        "expires_at": expires_at
    }
    
    response = supabase.table("users").upsert(data, on_conflict="email").execute()
    return response.data


def get_user_id(email: str):
    """Looks up the internal users.id for a given email."""
    response = supabase.table("users").select("id").eq("email", email).limit(1).execute()
    if response.data:
        return response.data[0]["id"]
    return None


def save_chat_message(email: str, role: str, content: str):
    """Persists one chat turn ('user' or 'assistant')."""
    user_id = get_user_id(email)
    if not user_id:
        return None
    data = {"user_id": user_id, "role": role, "content": content}
    response = supabase.table("chat_history").insert(data).execute()
    return response.data


def get_chat_history(email: str, limit: int = 50):
    """Returns past chat turns for a given user, ordered chronologically."""
    user_id = get_user_id(email)
    if not user_id:
        return []
    response = (
        supabase.table("chat_history")
        .select("role, content, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=False)
        .limit(limit)
        .execute()
    )
    return response.data or []