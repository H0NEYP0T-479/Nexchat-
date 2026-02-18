from fastapi import APIRouter, HTTPException
from database import users_collection, db
from models.contact import ContactAdd, ContactResponse
from datetime import datetime
from bson import ObjectId
from typing import List

router = APIRouter(prefix="/contacts", tags=["contacts"])
contacts_collection = db["contacts"]

@router.get("/search")
async def search_users(query: str):
    users = []
    cursor = users_collection.find({
        "$or": [
            {"username": {"$regex": query, "$options": "i"}},
            {"email": {"$regex": query, "$options": "i"}}
        ]
    }).limit(10)
    
    async for user in cursor:
        users.append({
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"]
        })
    return users

@router.post("/add")
async def add_contact(contact: ContactAdd):
    existing = await contacts_collection.find_one({
        "user_id": contact.user_id,
        "contact_user_id": contact.contact_user_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Contact already added")
    
    contact_user = await users_collection.find_one({"_id": ObjectId(contact.contact_user_id)})
    if not contact_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_contact = {
        "user_id": contact.user_id,
        "contact_user_id": contact.contact_user_id,
        "contact_username": contact_user["username"],
        "contact_email": contact_user["email"],
        "added_at": datetime.utcnow(),
        "is_online": False
    }
    
    result = await contacts_collection.insert_one(new_contact)
    return {"message": "Contact added", "id": str(result.inserted_id)}

@router.get("/list/{user_id}")
async def get_contacts(user_id: str):
    contacts = []
    cursor = contacts_collection.find({"user_id": user_id})
    
    async for contact in cursor:
        contacts.append({
            "id": str(contact["_id"]),
            "contact_user_id": contact["contact_user_id"],
            "contact_username": contact["contact_username"],
            "contact_email": contact["contact_email"],
            "added_at": contact["added_at"],
            "is_online": contact.get("is_online", False)
        })
    
    return contacts

@router.delete("/{contact_id}")
async def delete_contact(contact_id: str):
    result = await contacts_collection.delete_one({"_id": ObjectId(contact_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact deleted"}