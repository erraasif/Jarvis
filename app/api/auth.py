import msal
import httpx
import urllib.parse
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from app.config import settings
from app.services.supabase_client import save_user_tokens

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# FIX: Removed 'offline_access' because MSAL manages reserved scopes automatically
SCOPES = ["User.Read", "Mail.ReadWrite", "Calendars.ReadWrite", "Tasks.ReadWrite"]

def get_msal_app():
    return msal.ConfidentialClientApplication(
        settings.AZURE_CLIENT_ID,
        client_credential=settings.AZURE_CLIENT_SECRET,
        authority=f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}"
    )

@router.get("/login")
def login():
    msal_app = get_msal_app()
    auth_url = msal_app.get_authorization_request_url(
        scopes=SCOPES,
        redirect_uri=settings.AZURE_REDIRECT_URI
    )
    return RedirectResponse(auth_url)

@router.get("/callback")
def callback(code: str = None, error: str = None):
    if error:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {error}")
    
    msal_app = get_msal_app()
    result = msal_app.acquire_token_by_authorization_code(
        code=code,
        scopes=SCOPES,
        redirect_uri=settings.AZURE_REDIRECT_URI
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result.get("error_description"))
        
    access_token = result.get("access_token")
    refresh_token = result.get("refresh_token")
    expires_in = result.get("expires_in", 3600)

    # Fetch user info from Graph API to get primary email
    headers = {"Authorization": f"Bearer {access_token}"}
    user_res = httpx.get("https://graph.microsoft.com/v1.0/me", headers=headers).json()
    user_email = user_res.get("mail") or user_res.get("userPrincipalName")

    # Store encrypted tokens in Supabase
    save_user_tokens(user_email, access_token, refresh_token, expires_in)

    # Redirect user back to frontend with email in param
    redirect_url = f"{settings.FRONTEND_URL}/?user_email={urllib.parse.quote(user_email)}"
    return RedirectResponse(redirect_url)