from fastapi import APIRouter, HTTPException
from database import db
from models.conversation import PrivateMessage, PrivateMessageResponse
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/private", tags=["private_chat"])
private_messages_collection = db["private_messages"]

@router.post("/send")
async def send_private_message(message: PrivateMessage):
    new_message = {
        "sender_id": message.sender_id,
        "receiver_id": message.receiver_id,
        "text": message.text,
        "message_type": message.message_type,
        "media_url": message.media_url,
        "timestamp": datetime.utcnow(),
        "status": "sent"
    }
    
    result = await private_messages_collection.insert_one(new_message)
    
    return {
        "id": str(result.inserted_id),
        "sender_id": message.sender_id,
        "receiver_id": message.receiver_id,
        "text": message.text,
        "message_type": message.message_type,
        "media_url": message.media_url,
        "timestamp": new_message["timestamp"],
        "status": "sent"
    }

@router.get("/messages/{user_id}/{contact_id}")
async def get_private_messages(user_id: str, contact_id: str, limit: int = 50):
    messages = []
    
    cursor = private_messages_collection.find({
        "$or": [
            {"sender_id": user_id, "receiver_id": contact_id},
            {"sender_id": contact_id, "receiver_id": user_id}
        ]
    }).sort("timestamp", 1).limit(limit)
    
    async for msg in cursor:
        messages.append({
            "id": str(msg["_id"]),
            "sender_id": msg["sender_id"],
            "receiver_id": msg["receiver_id"],
            "text": msg["text"],
            "message_type": msg.get("message_type", "text"),
            "media_url": msg.get("media_url"),
            "timestamp": msg["timestamp"],
            "status": msg.get("status", "sent")
        })
    
    return messages

@router.put("/messages/{message_id}/status")
async def update_message_status(message_id: str, status: str):
    result = await private_messages_collection.update_one(
        {"_id": ObjectId(message_id)},
        {"$set": {"status": status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return {"message": "Status updated"}

@router.get("/conversations/{user_id}")
async def get_conversations(user_id: str):
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"sender_id": user_id},
                    {"receiver_id": user_id}
                ]
            }
        },
        {
            "$sort": {"timestamp": -1}
        },
        {
            "$group": {
                "_id": {
                    "$cond": [
                        {"$eq": ["$sender_id", user_id]},
                        "$receiver_id",
                        "$sender_id"
                    ]
                },
                "last_message": {"$first": "$text"},
                "last_message_time": {"$first": "$timestamp"},
                "unread_count": {
                    "$sum": {
                        "$cond": [
                            {
                                "$and": [
                                    {"$eq": ["$receiver_id", user_id]},
                                    {"$ne": ["$status", "read"]}
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]
    
    conversations = []
    async for conv in private_messages_collection.aggregate(pipeline):
        from database import users_collection
        contact = await users_collection.find_one({"_id": ObjectId(conv["_id"])})
        
        conversations.append({
            "contact_id": conv["_id"],
            "contact_username": contact["username"] if contact else "Unknown",
            "last_message": conv["last_message"],
            "last_message_time": conv["last_message_time"],
            "unread_count": conv["unread_count"]
        })
    
    return conversations