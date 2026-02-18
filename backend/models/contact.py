from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Contact(BaseModel):
    """Model for user contacts/friends"""
    user_id: str
    contact_user_id: str
    contact_username: str
    created_at: Optional[datetime] = None
    nickname: Optional[str] = None
    is_blocked: bool = False

class ContactRequest(BaseModel):
    """Model for contact/friend requests"""
    from_user_id: str
    to_user_id: str
    status: str = "pending"  # pending, accepted, rejected
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class AddContactRequest(BaseModel):
    """Request model for adding a contact"""
    username: str
    nickname: Optional[str] = None

class ContactResponse(BaseModel):
    """Response model for contact details"""
    id: str
    user_id: str
    contact_user_id: str
    contact_username: str
    nickname: Optional[str] = None
    is_blocked: bool
    created_at: datetime
    is_online: bool = False

class ContactRequestResponse(BaseModel):
    """Response model for contact requests"""
    id: str
    from_user_id: str
    from_username: str
    to_user_id: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
