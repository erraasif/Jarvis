from fastapi import APIRouter
from app.services.graph_client import graph_request

router = APIRouter(prefix="/emails", tags=["Emails"])

@router.get("")
def list_emails(user_email: str):
    fields = "subject,bodyPreview,isDraft,receivedDateTime,from"
    return graph_request(user_email, "GET", f"/me/messages?$top=15&$select={fields}")

@router.patch("/{email_id}")
def update_email_draft(user_email: str, email_id: str, data: dict):
    """Edits a draft's fields (e.g. subject, body). Only meaningful on drafts."""
    return graph_request(user_email, "PATCH", f"/me/messages/{email_id}", json=data)

@router.delete("/{email_id}")
def delete_email_draft(user_email: str, email_id: str):
    return graph_request(user_email, "DELETE", f"/me/messages/{email_id}")