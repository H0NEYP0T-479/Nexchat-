from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ContactAdd(BaseModel):
    user_id: str
    contact_user_id: str

class ContactResponse(BaseModel):
    id: str
    user_id: str
    contact_user_id: str
    contact_username: str
    contact_email: str
    added_at: datetime
    last_seen: Optional[datetime] = None
    is_online: bool = False