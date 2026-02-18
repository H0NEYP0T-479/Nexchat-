from fastapi import APIRouter, UploadFile, File, HTTPException
from openai import OpenAI
import os
from config import SECRET_KEY
from database import db
from models.ai_message import AIMessageRequest, AIMessageResponse
from datetime import datetime
from bson import ObjectId
import aiofiles

router = APIRouter(prefix="/ai", tags=["ai"])
ai_messages_collection = db["ai_messages"]

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@router.post("/voice-to-text")
async def voice_to_text(audio: UploadFile = File(...), user_id: str = ""):
    """Convert voice to text using OpenAI Whisper"""
    try:
        # Save audio temporarily
        temp_path = f"temp_{user_id}_{audio.filename}"
        
        async with aiofiles.open(temp_path, 'wb') as f:
            content = await audio.read()
            await f.write(content)
        
        # Transcribe using Whisper
        with open(temp_path, 'rb') as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="en"
            )
        
        # Clean up temp file
        os.remove(temp_path)
        
        return {"text": transcript.text}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@router.post("/chat")
async def ai_chat(request: AIMessageRequest):
    """Get AI response using ChatGPT"""
    try:
        # Get conversation history (last 10 messages)
        history = []
        cursor = ai_messages_collection.find(
            {"user_id": request.user_id}
        ).sort("timestamp", -1).limit(10)
        
        async for msg in cursor:
            history.insert(0, {
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Add current user message
        history.append({
            "role": "user",
            "content": request.message
        })
        
        # Get AI response
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # or gpt-3.5-turbo for cheaper
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant integrated into a chat application. Be concise and friendly."},
                *history
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        ai_reply = response.choices[0].message.content
        
        # Save user message
        user_msg = {
            "user_id": request.user_id,
            "role": "user",
            "content": request.message,
            "timestamp": datetime.utcnow()
        }
        await ai_messages_collection.insert_one(user_msg)
        
        # Save AI response
        ai_msg = {
            "user_id": request.user_id,
            "role": "assistant",
            "content": ai_reply,
            "timestamp": datetime.utcnow()
        }
        result = await ai_messages_collection.insert_one(ai_msg)
        
        return AIMessageResponse(
            reply=ai_reply,
            message_id=str(result.inserted_id)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")

@router.post("/text-to-speech")
async def text_to_speech(text: str):
    """Convert text to speech using OpenAI TTS"""
    try:
        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text
        )
        
        # Save audio file
        filename = f"tts_{datetime.utcnow().timestamp()}.mp3"
        filepath = os.path.join(os.getenv("UPLOAD_DIR", "uploads"), filename)
        
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        return {"audio_url": f"/uploads/{filename}"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")

@router.get("/history/{user_id}")
async def get_ai_history(user_id: str, limit: int = 50):
    """Get AI conversation history"""
    messages = []
    
    cursor = ai_messages_collection.find(
        {"user_id": user_id}
    ).sort("timestamp", 1).limit(limit)
    
    async for msg in cursor:
        messages.append({
            "id": str(msg["_id"]),
            "role": msg["role"],
            "content": msg["content"],
            "timestamp": msg["timestamp"]
        })
    
    return messages