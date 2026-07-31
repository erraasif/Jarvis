"""
Calendar Tools for JARVIS
========================
Provides autonomous CRUD operations for Microsoft Graph Calendar API.
Designed for immediate execution without unnecessary user confirmation loops.
"""

from typing import Optional
import datetime
from langchain_core.tools import tool
from app.services.graph_client import graph_request


@tool
def get_calendar_events(user_email: str, top: int = 10):
    """
    Retrieves upcoming calendar events for the user.
    
    Args:
        user_email: User's primary email address.
        top: Number of events to retrieve (default 10).
    """
    endpoint = f"/me/events?$top={top}&$select=id,subject,start,end,location,bodyPreview&$orderby=start/dateTime ASC"
    return graph_request(user_email, "GET", endpoint)


@tool
def create_calendar_event(
    user_email: str,
    subject: str,
    start_time: str,
    end_time: Optional[str] = None,
    user_timezone: str = "UTC",
    location: Optional[str] = None,
    body: Optional[str] = None
):
    """
    Creates a calendar event immediately in Microsoft Graph.
    
    Args:
        user_email: User's primary email address.
        subject: Title or subject of the meeting/event.
        start_time: ISO format timestamp without offset (e.g. '2026-08-01T15:00:00').
        end_time: Optional end ISO timestamp. If omitted, defaults to 30 minutes after start_time.
        user_timezone: Target IANA timezone string (e.g. 'Asia/Karachi', 'America/New_York').
        location: Optional meeting location or online link.
        body: Optional description or agenda for the meeting.
    """
    # Autonomous Smart Default: Auto-calculate 30 minute end time if not specified
    if not end_time:
        try:
            start_dt = datetime.datetime.fromisoformat(start_time)
            end_dt = start_dt + datetime.timedelta(minutes=30)
            end_time = end_dt.isoformat()
        except Exception:
            end_time = start_time

    payload = {
        "subject": subject,
        "start": {
            "dateTime": start_time,
            "timeZone": user_timezone
        },
        "end": {
            "dateTime": end_time,
            "timeZone": user_timezone
        }
    }

    if location:
        payload["location"] = {"displayName": location}
    
    if body:
        payload["body"] = {"contentType": "Text", "content": body}

    return graph_request(user_email, "POST", "/me/events", json=payload)


@tool
def update_calendar_event(
    user_email: str,
    event_id: str,
    subject: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    user_timezone: str = "UTC",
    location: Optional[str] = None,
    body: Optional[str] = None
):
    """
    Updates details of an existing calendar event in Microsoft Graph.
    
    Args:
        user_email: User's primary email address.
        event_id: Graph API event ID.
        subject: Optional updated subject.
        start_time: Optional updated start ISO timestamp.
        end_time: Optional updated end ISO timestamp.
        user_timezone: IANA timezone string for updated times.
        location: Optional updated location name.
        body: Optional updated event body/description.
    """
    payload = {}

    if subject:
        payload["subject"] = subject
    if start_time:
        payload["start"] = {"dateTime": start_time, "timeZone": user_timezone}
    if end_time:
        payload["end"] = {"dateTime": end_time, "timeZone": user_timezone}
    if location:
        payload["location"] = {"displayName": location}
    if body:
        payload["body"] = {"contentType": "Text", "content": body}

    return graph_request(user_email, "PATCH", f"/me/events/{event_id}", json=payload)


@tool
def delete_calendar_event(user_email: str, event_id: str):
    """
    Deletes a calendar event by ID immediately.
    
    Args:
        user_email: User's primary email address.
        event_id: Graph API ID of the event to delete.
    """
    return graph_request(user_email, "DELETE", f"/me/events/{event_id}")