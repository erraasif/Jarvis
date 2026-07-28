from pydantic import BaseModel
from typing import Optional

class TodoCreate(BaseModel):
    title: str

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = "completed"  # Options: 'notStarted', 'inProgress', 'completed'