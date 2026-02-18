from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGODB_URL, DATABASE_NAME

client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

users_collection = db["users"]
messages_collection = db["messages"]
conversations_collection = db["conversations"]
conversation_messages_collection = db["conversation_messages"]
contacts_collection = db["contacts"]
contact_requests_collection = db["contact_requests"]
media_collection = db["media"]
ai_conversations_collection = db["ai_conversations"]
ai_messages_collection = db["ai_messages"]