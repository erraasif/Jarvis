import httpx
import msal
from app.config import settings
from app.services.supabase_client import supabase, decrypt_token, save_user_tokens

def get_valid_access_token(user_email: str) -> str:
    """Retrieves access token from Supabase, refreshing it via MSAL if necessary."""
    res = supabase.table("users").select("*").eq("email", user_email).execute()
    if not res.data:
        raise Exception(f"User {user_email} not found. Please log in first.")
    
    user_record = res.data[0]
    refresh_token = decrypt_token(user_record["refresh_token"])
    
    msal_app = msal.ConfidentialClientApplication(
        settings.AZURE_CLIENT_ID,
        client_credential=settings.AZURE_CLIENT_SECRET,
        authority=f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}"
    )
    
    scopes = ["User.Read", "Mail.ReadWrite", "Calendars.ReadWrite", "Tasks.ReadWrite", "offline_access"]
    result = msal_app.acquire_token_by_refresh_token(refresh_token, scopes=scopes)
    
    if "error" in result:
        raise Exception(f"Failed to refresh token: {result.get('error_description')}")
        
    new_access_token = result.get("access_token")
    new_refresh_token = result.get("refresh_token", refresh_token)
    expires_in = result.get("expires_in", 3600)
    
    save_user_tokens(user_email, new_access_token, new_refresh_token, expires_in)
    return new_access_token

def graph_request(user_email: str, method: str, endpoint: str, json: dict = None, params: dict = None):
    """Generic helper for making Graph API calls."""
    token = get_valid_access_token(user_email)
    url = f"https://graph.microsoft.com/v1.0{endpoint}"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    with httpx.Client() as client:
        response = client.request(method, url, headers=headers, json=json, params=params)
        if response.status_code == 204:
            return {"status": "success"}
        return response.json()