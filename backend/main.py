from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes import auth, chat, contacts, private_chat, ai, media
from websocket_manager import manager
from database import messages_collection
from datetime import datetime
import json
import os

app = FastAPI(title="Nexchat API")

# Create uploads directory
os.makedirs("uploads", exist_ok=True)

# Mount uploads directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str):
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Include all routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(contacts.router)
app.include_router(private_chat.router)
app.include_router(ai.router)
app.include_router(media.router)

@app.get("/")
async def root():
    return {"message": "Nexchat API with AI Assistant is running"}

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)

            new_message = {
                "room": room_id,
                "sender": message_data["sender"],
                "sender_id": message_data["sender_id"],
                "text": message_data["text"],
                "timestamp": datetime.utcnow()
            }
            result = await messages_collection.insert_one(new_message)

            broadcast_msg = {
                "id": str(result.inserted_id),
                "room": room_id,
                "sender": message_data["sender"],
                "sender_id": message_data["sender_id"],
                "text": message_data["text"],
                "timestamp": datetime.utcnow().isoformat()
            }

            await manager.broadcast(json.dumps(broadcast_msg), room_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)