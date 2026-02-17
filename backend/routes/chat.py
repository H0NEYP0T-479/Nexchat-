from fastapi import APIRouter, HTTPException, Query
from database import messages_collection
from models.message import MessageResponse
from typing import List
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["chat"])

def format_message(msg) -> dict:
    return {
        "id": str(msg["_id"]),
        "room": msg["room"],
        "sender": msg["sender"],
        "sender_id": msg["sender_id"],
        "text": msg["text"],
        "timestamp": msg["timestamp"]
    }

@router.get("/messages/{room_id}")
async def get_messages(room_id: str, limit: int = Query(50)):
    cursor = messages_collection.find(
        {"room": room_id}
    ).sort("timestamp", 1).limit(limit)

    messages = []
    async for msg in cursor:
        messages.append(format_message(msg))
    return messages

@router.get("/rooms")
async def get_rooms():
    # Return default rooms
    return [
        {"id": "general", "name": "General", "description": "General chat"},
        {"id": "tech", "name": "Tech", "description": "Tech discussions"},
        {"id": "random", "name": "Random", "description": "Random topics"},
    ]