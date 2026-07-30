"""
Microsoft Graph API Client & Token Management Module
===================================================
Handles OAuth2 token validation, MSAL silent token refreshing via Supabase,
and exposes a generic HTTP wrapper for Microsoft Graph REST v1.0 endpoints.
"""

import logging
from datetime import datetime, timezone
import httpx
import msal

from app.config import settings
from app.services.supabase_client import supabase, decrypt_token, save_user_tokens

logger = logging.getLogger(__name__)

# Pre-configured Microsoft Graph Scopes required by JARVIS agent tools
GRAPH_SCOPES = [
    "User.Read",
    "Mail.ReadWrite",
    "Calendars.ReadWrite",
    "Tasks.ReadWrite",
    "offline_access"
]


def get_valid_access_token(user_email: str) -> str:
    """
    Retrieves a valid Microsoft Graph Access Token for a given user.
    Uses stored database access tokens if valid; otherwise, refreshes the token
    via MSAL Confidential Client using the stored Refresh Token.

    Args:
        user_email (str): The primary email identifier of the user.

    Returns:
        str: Decrypted, valid access token ready for Bearer auth header.

    Raises:
        Exception: If user record is missing or MSAL authentication fails.
    """
    res = supabase.table("users").select("*").eq("email", user_email).execute()
    if not res.data:
        raise Exception(f"User '{user_email}' not found. Please log in first.")

    user_record = res.data[0]
    
    # Check if existing access token is still valid (with a 5-minute buffer)
    expires_at_str = user_record.get("expires_at")
    existing_access_token = user_record.get("access_token")

    if expires_at_str and existing_access_token:
        try:
            expires_at = datetime.fromisoformat(expires_at_str)
            # Add 5 minutes buffer to prevent edge-case expiration during request
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)

            if datetime.now(timezone.utc).timestamp() + 300 < expires_at.timestamp():
                return decrypt_token(existing_access_token)
        except Exception as e:
            logger.warning(f"Failed to parse stored access token expiration: {e}")

    # Token is expired or missing; perform MSAL Refresh Grant flow
    logger.info(f"Access token expired or missing for {user_email}. Refreshing token...")
    refresh_token = decrypt_token(user_record["refresh_token"])

    msal_app = msal.ConfidentialClientApplication(
        settings.AZURE_CLIENT_ID,
        client_credential=settings.AZURE_CLIENT_SECRET,
        authority=f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}"
    )

    result = msal_app.acquire_token_by_refresh_token(refresh_token, scopes=GRAPH_SCOPES)

    if "error" in result:
        err_msg = result.get("error_description", result.get("error"))
        logger.error(f"MSAL Refresh Error for {user_email}: {err_msg}")
        raise Exception(f"Failed to refresh authentication token: {err_msg}")

    new_access_token = result.get("access_token")
    new_refresh_token = result.get("refresh_token", refresh_token)
    expires_in = result.get("expires_in", 3600)

    # Persist newly acquired credentials
    save_user_tokens(user_email, new_access_token, new_refresh_token, expires_in)
    return new_access_token


def graph_request(
    user_email: str, 
    method: str, 
    endpoint: str, 
    json: dict = None, 
    params: dict = None
) -> dict:
    """
    Generic HTTP wrapper for making authenticated calls to Microsoft Graph API.

    Args:
        user_email (str): Target user's account email.
        method (str): HTTP Method (GET, POST, PATCH, DELETE).
        endpoint (str): Graph API relative endpoint (e.g., '/me/messages').
        json (dict, optional): JSON request payload. Defaults to None.
        params (dict, optional): Query string parameters. Defaults to None.

    Returns:
        dict: Parsed JSON response payload or status confirmation object.

    Raises:
        Exception: Surfaced API status errors (HTTP 400+) with Graph error details.
    """
    token = get_valid_access_token(user_email)
    url = f"https://graph.microsoft.com/v1.0{endpoint}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    with httpx.Client(timeout=30.0) as client:
        response = client.request(method, url, headers=headers, json=json, params=params)

        # HTTP 204 No Content optimization (common in DELETE/PATCH operations)
        if response.status_code == 204:
            return {"status": "success", "code": 204}

        # Raise surface errors on 4xx / 5xx responses for agent tool visibility
        if response.status_code >= 400:
            try:
                detail = response.json()
            except Exception:
                detail = response.text
            
            logger.error(f"Graph API Error [{response.status_code}] on {endpoint}: {detail}")
            raise Exception(f"Microsoft Graph API Error ({response.status_code}): {detail}")

        return response.json()