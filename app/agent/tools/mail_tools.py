"""
Email Tools for JARVIS
======================
Provides autonomous email management for Microsoft Graph (Outlook).
Follows a strict Bias for Action: creates drafts immediately without repetitive 
confirmation loops, while keeping all outbound messages safely saved as DRAFTS.
"""

from typing import Optional
from langchain_core.tools import tool
from app.services.graph_client import graph_request


@tool
def get_emails(user_email: str, top: int = 5):
    """
    Fetches recent emails from the user's Microsoft Outlook inbox.
    
    Args:
        user_email: Primary email address of the authenticated user.
        top: Number of recent messages to fetch (default 5).
    """
    endpoint = f"/me/messages?$top={top}&$select=id,subject,from,bodyPreview,receivedDateTime,isRead&$orderby=receivedDateTime DESC"
    return graph_request(user_email, "GET", endpoint)


@tool
def get_unread_emails(user_email: str, top: int = 5):
    """
    Fetches only unread emails from the user's Microsoft Outlook inbox.
    
    Args:
        user_email: Primary email address of the authenticated user.
        top: Number of unread messages to fetch (default 5).
    """
    endpoint = f"/me/messages?$filter=isRead eq false&$top={top}&$select=id,subject,from,bodyPreview,receivedDateTime&$orderby=receivedDateTime DESC"
    return graph_request(user_email, "GET", endpoint)


@tool
def create_email_draft(user_email: str, recipient: str, subject: str, body: str):
    """
    Drafts an email in Outlook and saves it directly to the Drafts folder.
    NEVER sends the email automatically for safety reasons.
    
    Args:
        user_email: Primary email address of the authenticated user.
        recipient: Destination email address.
        subject: Subject line of the email.
        body: Main text/HTML content of the email.
    """
    payload = {
        "subject": subject,
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
        ]
    }
    return graph_request(user_email, "POST", "/me/messages", json=payload)


@tool
def create_reply_draft(user_email: str, message_id: str, reply_body: str):
    """
    Creates a draft response to an existing email message in Outlook.
    Does NOT send automatically; saves to Drafts folder immediately.
    
    Args:
        user_email: Primary email address of the authenticated user.
        message_id: Graph API message ID of the email being replied to.
        reply_body: Text or HTML response content to draft.
    """
    payload = {
        "comment": reply_body
    }
    return graph_request(user_email, "POST", f"/me/messages/{message_id}/createReply", json=payload)


@tool
def delete_email(user_email: str, message_id: str):
    """
    Deletes an email or draft message from Outlook by ID.
    
    Args:
        user_email: Primary email address of the authenticated user.
        message_id: Graph API ID of the message to delete.
    """
    return graph_request(user_email, "DELETE", f"/me/messages/{message_id}")