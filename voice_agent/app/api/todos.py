from fastapi import APIRouter
from app.services.graph_client import graph_request
from app.agent.tools.todo_tools import _get_default_todo_list_id

router = APIRouter(prefix="/todos", tags=["To-Do Tasks"])

@router.get("")
def get_todos(user_email: str):
    list_id = _get_default_todo_list_id(user_email)
    return graph_request(user_email, "GET", f"/me/todo/lists/{list_id}/tasks")

@router.post("")
def create_todo(user_email: str, data: dict):
    list_id = _get_default_todo_list_id(user_email)
    return graph_request(user_email, "POST", f"/me/todo/lists/{list_id}/tasks", json=data)

@router.patch("/{task_id}")
def update_todo(user_email: str, task_id: str, data: dict):
    list_id = _get_default_todo_list_id(user_email)
    return graph_request(user_email, "PATCH", f"/me/todo/lists/{list_id}/tasks/{task_id}", json=data)

@router.delete("/{task_id}")
def delete_todo(user_email: str, task_id: str):
    list_id = _get_default_todo_list_id(user_email)
    return graph_request(user_email, "DELETE", f"/me/todo/lists/{list_id}/tasks/{task_id}")