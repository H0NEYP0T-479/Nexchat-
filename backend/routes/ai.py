from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from database import db
from services.openai_service import openai_service
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["ai"])

# Collections
ai_conversations_collection = db["ai_conversations"]
ai_messages_collection = db["ai_messages"]

class AIMessageRequest(BaseModel):
    message: str
    user_id: str
    conversation_id: Optional[str] = None

class AIMessageResponse(BaseModel):
    response: str
    conversation_id: str
    timestamp: datetime

class AIConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int

@router.post("/chat", response_model=AIMessageResponse)
async def chat_with_ai(request: AIMessageRequest):
    """
    Send a message to AI assistant and get a response
    """
    try:
        # Get or create conversation
        if request.conversation_id:
            conversation = await ai_conversations_collection.find_one(
                {"_id": ObjectId(request.conversation_id), "user_id": request.user_id}
            )
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            # Create new conversation
            new_conversation = {
                "user_id": request.user_id,
                "title": request.message[:50] + "..." if len(request.message) > 50 else request.message,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = await ai_conversations_collection.insert_one(new_conversation)
            request.conversation_id = str(result.inserted_id)
        
        # Get conversation history
        history = []
        if request.conversation_id:
            cursor = ai_messages_collection.find(
                {"conversation_id": request.conversation_id}
            ).sort("timestamp", 1).limit(10)
            async for msg in cursor:
                history.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        # Save user message
        user_message = {
            "conversation_id": request.conversation_id,
            "user_id": request.user_id,
            "role": "user",
            "content": request.message,
            "timestamp": datetime.utcnow()
        }
        await ai_messages_collection.insert_one(user_message)
        
        # Generate AI response
        ai_response = await openai_service.generate_response(request.message, history)
        
        # Save AI response
        assistant_message = {
            "conversation_id": request.conversation_id,
            "user_id": request.user_id,
            "role": "assistant",
            "content": ai_response,
            "timestamp": datetime.utcnow()
        }
        await ai_messages_collection.insert_one(assistant_message)
        
        # Update conversation timestamp
        await ai_conversations_collection.update_one(
            {"_id": ObjectId(request.conversation_id)},
            {"$set": {"updated_at": datetime.utcnow()}}
        )
        
        return AIMessageResponse(
            response=ai_response,
            conversation_id=request.conversation_id,
            timestamp=datetime.utcnow()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/{user_id}", response_model=List[AIConversationResponse])
async def get_ai_conversations(user_id: str):
    """
    Get all AI conversations for a user
    """
    try:
        conversations = []
        cursor = ai_conversations_collection.find(
            {"user_id": user_id}
        ).sort("updated_at", -1)
        
        async for conv in cursor:
            # Count messages in conversation
            message_count = await ai_messages_collection.count_documents(
                {"conversation_id": str(conv["_id"])}
            )
            
            conversations.append(AIConversationResponse(
                id=str(conv["_id"]),
                user_id=conv["user_id"],
                title=conv.get("title", "New Conversation"),
                created_at=conv["created_at"],
                updated_at=conv["updated_at"],
                message_count=message_count
            ))
        
        return conversations
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversation/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str):
    """
    Get all messages in an AI conversation
    """
    try:
        messages = []
        cursor = ai_messages_collection.find(
            {"conversation_id": conversation_id}
        ).sort("timestamp", 1)
        
        async for msg in cursor:
            messages.append({
                "id": str(msg["_id"]),
                "role": msg["role"],
                "content": msg["content"],
                "timestamp": msg["timestamp"]
            })
        
        return messages
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/conversation/{conversation_id}")
async def delete_ai_conversation(conversation_id: str, user_id: str):
    """
    Delete an AI conversation and all its messages
    """
    try:
        # Verify ownership
        conversation = await ai_conversations_collection.find_one(
            {"_id": ObjectId(conversation_id), "user_id": user_id}
        )
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Delete messages
        await ai_messages_collection.delete_many({"conversation_id": conversation_id})
        
        # Delete conversation
        await ai_conversations_collection.delete_one({"_id": ObjectId(conversation_id)})
        
        return {"message": "Conversation deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
