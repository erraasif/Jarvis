"""
Supabase Client Service
======================
Manages user authentication tokens (with Fernet encryption/decryption)
and persists chat history logs, grouped into real conversation sessions.
"""

from datetime import datetime, timezone, timedelta
from supabase import create_client, Client
from cryptography.fernet import Fernet
from app.config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
fernet = Fernet(settings.TOKEN_ENCRYPTION_KEY.encode())


def encrypt_token(token: str) -> str:
    """Encrypts plaintext tokens before storing in Supabase."""
    if not token:
        return ""
    return fernet.encrypt(token.encode()).decode()


def decrypt_token(encrypted_token: str) -> str:
    """Decrypts tokens retrieved from Supabase."""
    if not encrypted_token:
        return ""
    return fernet.decrypt(encrypted_token.encode()).decode()


def save_user_tokens(email: str, access_token: str, refresh_token: str, expires_in_or_at):
    """
    Persists user tokens into Supabase safely.
    Formats expires_at as an ISO 8601 string for Postgres TIMESTAMPTZ compatibility.
    """
    encrypted_access = encrypt_token(access_token)
    encrypted_refresh = encrypt_token(refresh_token) if refresh_token else None

    if isinstance(expires_in_or_at, (int, float)):
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=int(expires_in_or_at))).isoformat()
    elif isinstance(expires_in_or_at, str) and expires_in_or_at.isdigit():
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=int(expires_in_or_at))).isoformat()
    else:
        expires_at = str(expires_in_or_at)

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


def save_chat_message(email: str, role: str, content: str, session_id: str):
    """Persists one chat turn ('user' or 'assistant') under a conversation session."""
    user_id = get_user_id(email)
    if not user_id:
        return None
    data = {"user_id": user_id, "role": role, "content": content, "session_id": session_id}
    response = supabase.table("chat_history").insert(data).execute()
    return response.data


def ensure_chat_session(email: str, session_id: str, title_hint: str = "New conversation"):
    """Creates the chat_sessions row for a session_id if it doesn't exist yet
    (first message of a new conversation) — no-op otherwise."""
    user_id = get_user_id(email)
    if not user_id:
        return None
    existing = supabase.table("chat_sessions").select("id").eq("id", session_id).limit(1).execute()
    if existing.data:
        return existing.data[0]
    data = {"id": session_id, "user_id": user_id, "title": title_hint[:60]}
    response = supabase.table("chat_sessions").insert(data).execute()
    return response.data


def rename_chat_session(email: str, session_id: str, new_title: str):
    user_id = get_user_id(email)
    if not user_id:
        return None
    response = (
        supabase.table("chat_sessions")
        .update({"title": new_title[:60], "updated_at": "now()"})
        .eq("id", session_id)
        .eq("user_id", user_id)
        .execute()
    )
    return response.data


def get_chat_history(email: str, session_id: str, limit: int = 200):
    """Returns the messages within one specific conversation session, oldest first."""
    user_id = get_user_id(email)
    if not user_id:
        return []
    response = (
        supabase.table("chat_history")
        .select("role, content, created_at")
        .eq("user_id", user_id)
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .limit(limit)
        .execute()
    )
    return response.data or []


def get_chat_sessions(email: str, limit: int = 30):
    """Returns this user's past conversations, newest-activity first."""
    user_id = get_user_id(email)
    if not user_id:
        return []
    response = (
        supabase.table("chat_sessions")
        .select("id, title, updated_at")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .limit(limit)
        .execute()
    )
    return [{"session_id": s["id"], "title": s["title"], "last_at": s["updated_at"]} for s in (response.data or [])]


def delete_chat_session(email: str, session_id: str):
    """Deletes a conversation session and all of its messages."""
    user_id = get_user_id(email)
    if not user_id:
        return None
    supabase.table("chat_history").delete().eq("user_id", user_id).eq("session_id", session_id).execute()
    return (
        supabase.table("chat_sessions")
        .delete()
        .eq("id", session_id)
        .eq("user_id", user_id)
        .execute()
    )