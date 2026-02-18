from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Conversation(BaseModel):
    """Model for 1-on-1 private conversations"""
    user1_id: str
    user2_id: str
    created_at: Optional[datetime] = None
    last_message_at: Optional[datetime] = None

class ConversationMessage(BaseModel):
    """Model for messages in private conversations"""
    conversation_id: str
    sender_id: str
    receiver_id: str
    text: str
    timestamp: Optional[datetime] = None
    is_read: bool = False
    media_url: Optional[str] = None
    media_type: Optional[str] = None

class ConversationResponse(BaseModel):
    """Response model for conversation details"""
    id: str
    user1_id: str
    user2_id: str
    other_user_username: str
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    created_at: datetime

class ConversationMessageResponse(BaseModel):
    """Response model for conversation messages"""
    id: str
    conversation_id: str
    sender_id: str
    receiver_id: str
    text: str
    timestamp: datetime
    is_read: bool
    media_url: Optional[str] = None
    media_type: Optional[str] = None
