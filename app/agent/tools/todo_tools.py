from langchain_core.tools import tool
from app.services.graph_client import graph_request

def _get_default_todo_list_id(user_email: str) -> str:
    lists = graph_request(user_email, "GET", "/me/todo/lists")
    return lists["value"][0]["id"]

@tool
def get_todos(user_email: str):
    """Fetches to-do tasks from the default list."""
    list_id = _get_default_todo_list_id(user_email)
    return graph_request(user_email, "GET", f"/me/todo/lists/{list_id}/tasks")

@tool
def create_todo(user_email: str, title: str):
    """Creates a new to-do task."""
    list_id = _get_default_todo_list_id(user_email)
    return graph_request(user_email, "POST", f"/me/todo/lists/{list_id}/tasks", json={"title": title})

@tool
def update_todo(user_email: str, task_id: str, status: str = "completed"):
    """Updates task status ('notStarted', 'inProgress', 'completed')."""
    list_id = _get_default_todo_list_id(user_email)
    return graph_request(user_email, "PATCH", f"/me/todo/lists/{list_id}/tasks/{task_id}", json={"status": status})

@tool
def delete_todo(user_email: str, task_id: str):
    """Deletes a to-do task."""
    list_id = _get_default_todo_list_id(user_email)
    return graph_request(user_email, "DELETE", f"/me/todo/lists/{list_id}/tasks/{task_id}")