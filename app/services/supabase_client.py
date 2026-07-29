from datetime import datetime, timedelta, timezone
from supabase import create_client, Client
from cryptography.fernet import Fernet
from app.config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
fernet = Fernet(settings.TOKEN_ENCRYPTION_KEY.encode())

def encrypt_token(token: str) -> str:
    return fernet.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    return fernet.decrypt(encrypted_token.encode()).decode()

def save_user_tokens(email: str, access_token: str, refresh_token: str, expires_in: int):
    encrypted_access = encrypt_token(access_token)
    encrypted_refresh = encrypt_token(refresh_token) if refresh_token else None
    
    # Calculate ISO format timestamp for Supabase timestamptz column
    expires_at = (datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))).isoformat()
    
    data = {
        "email": email,
        "access_token": encrypted_access,
        "refresh_token": encrypted_refresh,
        "expires_at": expires_at  # <-- FIX: Added missing expires_at field
    }
    
    # Upsert user record into Supabase
    response = supabase.table("users").upsert(data, on_conflict="email").execute()
    return response.data