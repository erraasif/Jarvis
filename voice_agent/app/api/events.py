from fastapi import APIRouter
from app.services.graph_client import graph_request

router = APIRouter(prefix="/events", tags=["Calendar Events"])

@router.get("")
def get_events(user_email: str):
    return graph_request(user_email, "GET", "/me/events")

@router.post("")
def create_event(user_email: str, data: dict):
    return graph_request(user_email, "POST", "/me/events", json=data)

@router.patch("/{event_id}")
def update_event(user_email: str, event_id: str, data: dict):
    return graph_request(user_email, "PATCH", f"/me/events/{event_id}", json=data)

@router.delete("/{event_id}")
def delete_event(user_email: str, event_id: str):
    return graph_request(user_email, "DELETE", f"/me/events/{event_id}")