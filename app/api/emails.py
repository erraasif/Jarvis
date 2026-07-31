from fastapi import APIRouter
from app.services.graph_client import graph_request

router = APIRouter(prefix="/emails", tags=["Emails"])

@router.get("")
def list_emails(user_email: str):
    fields = "subject,bodyPreview,isDraft,receivedDateTime,from"
    return graph_request(user_email, "GET", f"/me/messages?$top=15&$select={fields}")