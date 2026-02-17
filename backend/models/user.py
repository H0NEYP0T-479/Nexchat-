from pydantic import BaseModel
from typing import Optional

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    username: str
    user_id: str