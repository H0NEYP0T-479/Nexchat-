from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PrivateMessage(BaseModel):
    sender_id: str
    receiver_id: str
    text: str
    message_type: str = "text"
    media_url: Optional[str] = None

class PrivateMessageResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    text: str
    message_type: str
    media_url: Optional[str] = None
    timestamp: datetime
    status: str = "sent"
    
class ConversationResponse(BaseModel):
    contact_id: str
    contact_username: str
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: int = 0