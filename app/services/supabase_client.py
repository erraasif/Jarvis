def save_user_tokens(email: str, access_token: str, refresh_token: str, expires_in_or_at):
    """
    Persists user tokens into Supabase. 
    Safely calculates expires_at as an ISO 8601 string for TIMESTAMPTZ compatibility.
    """
    encrypted_access = encrypt_token(access_token)
    encrypted_refresh = encrypt_token(refresh_token) if refresh_token else None
    
    # Check if input is already an ISO string vs integer seconds
    if isinstance(expires_in_or_at, (int, float)):
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=int(expires_in_or_at))).isoformat()
    elif isinstance(expires_in_or_at, str) and expires_in_or_at.isdigit():
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=int(expires_in_or_at))).isoformat()
    else:
        # Already formatted ISO string
        expires_at = str(expires_in_or_at)
    
    data = {
        "email": email,
        "access_token": encrypted_access,
        "refresh_token": encrypted_refresh,
        "expires_at": expires_at
    }
    
    response = supabase.table("users").upsert(data, on_conflict="email").execute()
    return response.data