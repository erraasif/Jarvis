from fastapi import APIRouter
from app.services.graph_client import graph_request

router = APIRouter(prefix="/emails", tags=["Emails"])

@router.get("")
def list_emails(user_email: str):
    return graph_request(user_email, "GET", "/me/messages?$top=10")