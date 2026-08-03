"""
To-Do Tools for JARVIS
======================
Provides autonomous task management for Microsoft To-Do (Outlook Tasks).
Executes actions immediately without repetitive confirmation loops.
"""

from typing import Optional
from langchain_core.tools import tool
from app.services.graph_client import graph_request


def _get_default_todo_list_id(user_email: str) -> str:
    """
    Helper function to dynamically fetch the user's default To-Do list ID.
    Falls back to 'tasks' if list retrieval fails.
    """
    user_email = user_email.strip().lower()
    try:
        lists = graph_request(user_email, "GET", "/me/todo/lists")
        if lists and "value" in lists and len(lists["value"]) > 0:
            for lst in lists["value"]:
                if lst.get("wellknownListName") == "defaultList":
                    return lst["id"]
            return lists["value"][0]["id"]
    except Exception:
        pass
    return "tasks"


@tool
def get_todos(user_email: str, list_id: Optional[str] = None):
    """
    Fetches tasks from the user's Microsoft To-Do list.
    
    Args:
        user_email: Authenticated user's primary email.
        list_id: Optional specific list ID. Uses default list if omitted.
    """
    user_email = user_email.strip().lower()
    target_list_id = list_id or _get_default_todo_list_id(user_email)
    endpoint = f"/me/todo/lists/{target_list_id}/tasks?$select=id,title,status,dueDateTime,createdDateTime"
    return graph_request(user_email, "GET", endpoint)


@tool
def create_todo(
    user_email: str, 
    title: str, 
    due_date_time: Optional[str] = None,
    user_timezone: str = "UTC",
    list_id: Optional[str] = None
):
    """
    Creates a new to-do task immediately in Microsoft To-Do.
    
    Args:
        user_email: Authenticated user's primary email.
        title: Task name/description.
        due_date_time: Optional due ISO timestamp (e.g. '2026-08-01T17:00:00').
        user_timezone: Target timezone string (e.g. 'Asia/Karachi').
        list_id: Optional specific list ID. Uses default list if omitted.
    """
    user_email = user_email.strip().lower()
    target_list_id = list_id or _get_default_todo_list_id(user_email)
    payload = {"title": title}

    if due_date_time:
        payload["dueDateTime"] = {
            "dateTime": due_date_time,
            "timeZone": user_timezone
        }

    return graph_request(user_email, "POST", f"/me/todo/lists/{target_list_id}/tasks", json=payload)


@tool
def update_todo(
    user_email: str, 
    task_id: str, 
    title: Optional[str] = None,
    status: Optional[str] = "completed",
    list_id: Optional[str] = None
):
    """
    Updates an existing task's title or status ('notStarted', 'inProgress', 'completed').
    
    Args:
        user_email: Authenticated user's primary email.
        task_id: Graph API task ID.
        title: Optional updated title.
        status: Target status ('notStarted', 'inProgress', or 'completed'). Defaults to 'completed'.
        list_id: Optional specific list ID. Uses default list if omitted.
    """
    user_email = user_email.strip().lower()
    target_list_id = list_id or _get_default_todo_list_id(user_email)
    payload = {}

    if title is not None:
        payload["title"] = title
    if status is not None:
        payload["status"] = status

    return graph_request(user_email, "PATCH", f"/me/todo/lists/{target_list_id}/tasks/{task_id}", json=payload)


@tool
def delete_todo(user_email: str, task_id: str, list_id: Optional[str] = None):
    """
    Deletes a to-do task by ID.
    
    Args:
        user_email: Authenticated user's primary email.
        task_id: Graph API task ID.
        list_id: Optional specific list ID. Uses default list if omitted.
    """
    user_email = user_email.strip().lower()
    target_list_id = list_id or _get_default_todo_list_id(user_email)
    return graph_request(user_email, "DELETE", f"/me/todo/lists/{target_list_id}/tasks/{task_id}")