"""
Mail Tools Module for JARVIS Agent
==================================
Contains LangChain tool definitions for inspecting and managing Outlook emails.
"""

from typing import Annotated
from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState
from app.services.graph_client import graph_request


@tool
def get_emails(
    user_email: Annotated[str, InjectedState("user_email")],
    top: int = 5
):
    """
    Fetches recent emails for the user.
    'top' indicates the number of emails to retrieve (must be an integer, e.g. 5 or 10).
    """
    if isinstance(top, str):
        try:
            top = int(top)
        except ValueError:
            top = 5

    return graph_request(
        user_email,
        "GET",
        f"/me/messages?$top={top}&$select=subject,sender,bodyPreview,receivedDateTime,isDraft"
    )


@tool
def create_email_draft(
    user_email: Annotated[str, InjectedState("user_email")],
    recipient: str,
    subject: str,
    body: str
):
    """Drafts an email in Outlook. NEVER sends it automatically."""
    payload = {
        "subject": subject,
        "body": {"contentType": "HTML", "content": body},
        "toRecipients": [{"emailAddress": {"address": recipient}}]
    }
    return graph_request(user_email, "POST", "/me/messages", json=payload)


@tool
def update_email_draft(
    user_email: Annotated[str, InjectedState("user_email")],
    email_id: str,
    subject: str = None,
    body: str = None
):
    """
    Edits an existing draft's subject and/or body.
    Only works on drafts — Graph rejects edits to already-sent messages.
    """
    payload = {}
    if subject:
        payload["subject"] = subject
    if body:
        payload["body"] = {"contentType": "HTML", "content": body}
    return graph_request(user_email, "PATCH", f"/me/messages/{email_id}", json=payload)


@tool
def delete_email_draft(
    user_email: Annotated[str, InjectedState("user_email")],
    email_id: str
):
    """Deletes a draft email by ID."""
    return graph_request(user_email, "DELETE", f"/me/messages/{email_id}")