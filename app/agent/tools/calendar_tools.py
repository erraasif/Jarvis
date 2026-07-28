from langchain_core.tools import tool
from app.services.graph_client import graph_request

@tool
def get_calendar_events(user_email: str):
    """Retrieves upcoming calendar events."""
    return graph_request(user_email, "GET", "/me/events?$select=id,subject,start,end,location")

@tool
def create_calendar_event(user_email: str, subject: str, start_time: str, end_time: str):
    """Creates a calendar event. ISO format timestamps required (e.g. 2026-07-28T10:00:00)."""
    payload = {
        "subject": subject,
        "start": {"dateTime": start_time, "timeZone": "UTC"},
        "end": {"dateTime": end_time, "timeZone": "UTC"}
    }
    return graph_request(user_email, "POST", "/me/events", json=payload)

@tool
def update_calendar_event(user_email: str, event_id: str, subject: str = None):
    """Updates an existing calendar event."""
    payload = {}
    if subject:
        payload["subject"] = subject
    return graph_request(user_email, "PATCH", f"/me/events/{event_id}", json=payload)

@tool
def delete_calendar_event(user_email: str, event_id: str):
    """Deletes a calendar event by ID."""
    return graph_request(user_email, "DELETE", f"/me/events/{event_id}")