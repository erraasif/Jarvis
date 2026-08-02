"""
Microsoft Graph Client Service
==============================
Handles access token caching, automatic MSAL token refreshing, and HTTP requests
to Microsoft Graph API for autonomous tools execution.
"""

from datetime import datetime, timezone, timedelta
import logging
import httpx
import msal
from app.config import settings
from app.services.supabase_client import supabase, decrypt_token, save_user_tokens

logger = logging.getLogger(__name__)

# Reserved MSAL scopes for Microsoft Graph API
SCOPES = ["User.Read", "Mail.ReadWrite", "Calendars.ReadWrite", "Tasks.ReadWrite"]


def get_msal_app():
    """Initializes MSAL Confidential Client Application."""
    return msal.ConfidentialClientApplication(
        settings.AZURE_CLIENT_ID,
        client_credential=settings.AZURE_CLIENT_SECRET,
        authority=f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}"
    )


def get_valid_access_token(user_email: str) -> str:
    """
    Retrieves the access token from Supabase.
    If the token is expired (or close to expiring within 5 minutes), 
    refreshes it via MSAL and updates Supabase automatically.
    """
    res = supabase.table("users").select("*").eq("email", user_email).execute()
    if not res.data:
        raise Exception(f"User '{user_email}' not found. Please log in through /api/auth/login first.")

    user_record = res.data[0]
    
    # Decrypt stored tokens
    raw_access_token = decrypt_token(user_record.get("access_token"))
    raw_refresh_token = decrypt_token(user_record.get("refresh_token"))
    raw_expires_at = user_record.get("expires_at")

    # Parse ISO 8601 string or fallback if missing
    if raw_expires_at:
        if isinstance(raw_expires_at, str):
            expires_at_dt = datetime.fromisoformat(raw_expires_at.replace("Z", "+00:00"))
        else:
            expires_at_dt = datetime.fromtimestamp(int(raw_expires_at), tz=timezone.utc)
    else:
        expires_at_dt = datetime.now(timezone.utc)

    # Buffer: check if current time + 5 minutes is still before expiration
    now_utc = datetime.now(timezone.utc)
    
    # 1. Reuse access token if it is still valid for at least 5 minutes (300s buffer)
    if raw_access_token and (expires_at_dt - now_utc) > timedelta(minutes=5):
        return raw_access_token

    # 2. Token is expired or expiring soon -> Refresh via MSAL
    if not raw_refresh_token:
        raise Exception(f"No refresh token available for {user_email}. User must re-authenticate.")

    logger.info(f"Access token expired/expiring for {user_email}. Refreshing via MSAL...")
    msal_app = get_msal_app()
    
    result = msal_app.acquire_token_by_refresh_token(raw_refresh_token, scopes=SCOPES)

    if "error" in result:
        error_desc = result.get("error_description", "Unknown MSAL error")
        logger.error(f"Failed to refresh token for {user_email}: {error_desc}")
        raise Exception(f"Authentication session expired. Please log in again. ({error_desc})")

    new_access_token = result.get("access_token")
    new_refresh_token = result.get("refresh_token", raw_refresh_token)
    expires_in = result.get("expires_in", 3600)

    # Persist newly refreshed tokens back to database
    save_user_tokens(user_email, new_access_token, new_refresh_token, expires_in)
    
    return new_access_token


def graph_request(user_email: str, method: str, endpoint: str, json: dict = None, params: dict = None):
    """
    Executes authenticated requests to Microsoft Graph API.
    """
    token = get_valid_access_token(user_email)
    url = f"https://graph.microsoft.com/v1.0{endpoint}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    with httpx.Client(timeout=15.0) as client:
        response = client.request(method, url, headers=headers, json=json, params=params)
        
        # 204 No Content (successful DELETE operations)
        if response.status_code == 204:
            return {"status": "success"}
            
        # Catch and surface Graph API error codes cleanly
        if response.status_code >= 400:
            try:
                detail = response.json()
                error_msg = detail.get("error", {}).get("message", detail)
            except Exception:
                error_msg = response.text
                
            logger.error(f"Graph API Error [{response.status_code}] on {endpoint}: {error_msg}")
            raise Exception(f"Microsoft Graph API error ({response.status_code}): {error_msg}")
            
        return response.json()


def create_email_draft(user_email: str, body: str, recipient: str = None, subject: str = None, message_id: str = None):
    """
    Creates a draft email in Outlook Drafts folder safely.
    Auto-fetches the latest email if creating a reply without explicit target details.
    """
    # If drafting a reply to the "latest email" and details are missing:
    if not recipient or not subject:
        latest_msgs = graph_request(user_email, "GET", "/me/messages?$top=1&$select=id,subject,sender")
        if latest_msgs.get("value"):
            latest = latest_msgs["value"][0]
            message_id = message_id or latest.get("id")
            subject = subject or f"Re: {latest.get('subject', '')}"
            sender_info = latest.get("sender", {}).get("emailAddress", {})
            recipient = recipient or sender_info.get("address")

    if message_id:
        # Use native Microsoft Graph createReplyDraft endpoint
        endpoint = f"/me/messages/{message_id}/createReply"
        reply_payload = {
            "comment": body
        }
        return graph_request(user_email, "POST", endpoint, json=reply_payload)

    # Standard draft creation fallback
    payload = {
        "subject": subject or "No Subject",
        "body": {
            "contentType": "HTML",
            "content": body
        },
        "toRecipients": [
            {
                "emailAddress": {
                    "address": recipient
                }
            }
        ] if recipient else []
    }
    return graph_request(user_email, "POST", "/me/messages", json=payload)