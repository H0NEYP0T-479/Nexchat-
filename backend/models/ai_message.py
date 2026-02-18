from pydantic import BaseModel
from typing import Optional

class VoiceTranscriptRequest(BaseModel):
    user_id: str

class AIMessageRequest(BaseModel):
    user_id: str
    message: str

class AIMessageResponse(BaseModel):
    reply: str
    message_id: str