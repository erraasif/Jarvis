from langchain_core.tools import tool
from app.services.graph_client import graph_request

@tool
def get_emails(user_email: str, top: int = 5):
    """Fetches recent emails for the user."""
    return graph_request(user_email, "GET", f"/me/messages?$top={top}&$select=subject,sender,bodyPreview,receivedDateTime")

@tool
def create_email_draft(user_email: str, recipient: str, subject: str, body: str):
    """Drafts an email in Outlook. NEVER sends it."""
    payload = {
        "subject": subject,
        "body": {"contentType": "HTML", "content": body},
        "toRecipients": [{"emailAddress": {"address": recipient}}]
    }
    return graph_request(user_email, "POST", "/me/messages", json=payload)