"""
Authentication Router
=====================
Handles Microsoft Azure AD (Entra ID) OAuth2 authentication flow using MSAL.
Exchanges authorization codes for access and refresh tokens, saving them securely to Supabase.
"""

from datetime import datetime, timezone, timedelta
import logging
import urllib.parse
import httpx
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
import msal

from app.config import settings
from app.services.supabase_client import save_user_tokens

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# Microsoft Graph Scopes required for JARVIS tool execution
SCOPES = [
    "User.Read",
    "Mail.ReadWrite",
    "Calendars.ReadWrite",
    "Tasks.ReadWrite"
]


def get_msal_app():
    return msal.ConfidentialClientApplication(
        settings.AZURE_CLIENT_ID,
        client_credential=settings.AZURE_CLIENT_SECRET,
        authority=f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}"
    )


@router.get("/login")
def login(timezone: str = "UTC"):
    """
    Initiates Microsoft OAuth login. Passes the client's timezone 
    inside the state parameter for automatic agent context binding.
    """
    msal_app = get_msal_app()
    auth_url = msal_app.get_authorization_request_url(
        scopes=SCOPES,
        redirect_uri=settings.AZURE_REDIRECT_URI,
        state=timezone,
        prompt="consent"  # Ensures full refresh token issuance for long-running autonomous tasks
    )
    return RedirectResponse(auth_url)


@router.get("/callback")
def callback(code: str = None, error: str = None, state: str = "UTC"):
    """
    Handles OAuth callback, exchanges authorization code for tokens, 
    persists encrypted tokens, and redirects back to the frontend.
    """
    if error:
        logger.error(f"Authentication error during callback: {error}")
        raise HTTPException(status_code=400, detail=f"Authentication failed: {error}")

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code.")

    msal_app = get_msal_app()
    result = msal_app.acquire_token_by_authorization_code(
        code=code,
        scopes=SCOPES,
        redirect_uri=settings.AZURE_REDIRECT_URI
    )

    if "error" in result:
        logger.error(f"Token acquisition failed: {result.get('error_description')}")
        raise HTTPException(status_code=400, detail=result.get("error_description"))

    # Indented properly inside callback function:
    access_token = result.get("access_token")
    refresh_token = result.get("refresh_token")
    expires_in = result.get("expires_in", 3600)

    # Fetch user identity from Microsoft Graph
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        user_res = httpx.get("https://graph.microsoft.com/v1.0/me", headers=headers, timeout=10.0).json()
        user_email = user_res.get("mail") or user_res.get("userPrincipalName")
    except Exception as exc:
        logger.error(f"Failed to fetch user profile from Microsoft Graph: {exc}")
        raise HTTPException(status_code=500, detail="Failed to fetch user profile.")

    if not user_email:
        raise HTTPException(status_code=400, detail="Could not determine user email from Graph response.")

    # Save tokens to database
    save_user_tokens(user_email, access_token, refresh_token, expires_in)

    # Decode timezone passed in state parameter
    user_timezone = urllib.parse.quote(state)
    user_email_encoded = urllib.parse.quote(user_email)

    # Redirect user back to frontend with email and timezone context
    redirect_url = f"{settings.FRONTEND_URL}/?user_email={user_email_encoded}&timezone={user_timezone}"
    return RedirectResponse(redirect_url)