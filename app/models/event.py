from pydantic import BaseModel
from typing import Optional

class EventCreate(BaseModel):
    subject: str
    start_time: str  # ISO Format: 2026-07-28T10:00:00
    end_time: str    # ISO Format: 2026-07-28T11:00:00
    time_zone: Optional[str] = "UTC"

class EventUpdate(BaseModel):
    subject: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None