from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Message(BaseModel):
    room: str
    sender: str
    sender_id: str
    text: str
    timestamp: Optional[datetime] = None

class MessageResponse(BaseModel):
    id: str
    room: str
    sender: str
    sender_id: str
    text: str
    timestamp: datetime