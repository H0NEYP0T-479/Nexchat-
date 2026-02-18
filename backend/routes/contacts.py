from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
from bson import ObjectId
from database import db
from models.contact import (
    Contact, 
    ContactRequest,
    AddContactRequest,
    ContactResponse,
    ContactRequestResponse
)

router = APIRouter(prefix="/contacts", tags=["contacts"])

# Collections
contacts_collection = db["contacts"]
contact_requests_collection = db["contact_requests"]
users_collection = db["users"]

@router.get("/{user_id}", response_model=List[ContactResponse])
async def get_contacts(user_id: str):
    """
    Get all contacts for a user
    """
    try:
        contacts = []
        cursor = contacts_collection.find(
            {"user_id": user_id, "is_blocked": False}
        ).sort("created_at", -1)
        
        async for contact in cursor:
            contacts.append(ContactResponse(
                id=str(contact["_id"]),
                user_id=contact["user_id"],
                contact_user_id=contact["contact_user_id"],
                contact_username=contact["contact_username"],
                nickname=contact.get("nickname"),
                is_blocked=contact.get("is_blocked", False),
                created_at=contact["created_at"],
                is_online=False  # TODO: Implement online status
            ))
        
        return contacts
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}/add")
async def add_contact(user_id: str, request: AddContactRequest):
    """
    Send a contact request to another user
    """
    try:
        # Find the user to add
        target_user = await users_collection.find_one({"username": request.username})
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        target_user_id = str(target_user["_id"])
        
        # Can't add yourself
        if target_user_id == user_id:
            raise HTTPException(status_code=400, detail="Cannot add yourself as a contact")
        
        # Check if already contacts
        existing_contact = await contacts_collection.find_one({
            "user_id": user_id,
            "contact_user_id": target_user_id
        })
        if existing_contact:
            raise HTTPException(status_code=400, detail="Already in contacts")
        
        # Check if request already exists
        existing_request = await contact_requests_collection.find_one({
            "from_user_id": user_id,
            "to_user_id": target_user_id,
            "status": "pending"
        })
        if existing_request:
            raise HTTPException(status_code=400, detail="Contact request already sent")
        
        # Create contact request
        new_request = {
            "from_user_id": user_id,
            "to_user_id": target_user_id,
            "status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await contact_requests_collection.insert_one(new_request)
        
        return {
            "message": "Contact request sent",
            "request_id": str(result.inserted_id)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/requests", response_model=List[ContactRequestResponse])
async def get_contact_requests(user_id: str):
    """
    Get all pending contact requests for a user
    """
    try:
        requests = []
        cursor = contact_requests_collection.find({
            "to_user_id": user_id,
            "status": "pending"
        }).sort("created_at", -1)
        
        async for req in cursor:
            # Get sender username
            sender = await users_collection.find_one({"_id": ObjectId(req["from_user_id"])})
            sender_username = sender["username"] if sender else "Unknown"
            
            requests.append(ContactRequestResponse(
                id=str(req["_id"]),
                from_user_id=req["from_user_id"],
                from_username=sender_username,
                to_user_id=req["to_user_id"],
                status=req["status"],
                created_at=req["created_at"],
                updated_at=req.get("updated_at")
            ))
        
        return requests
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/requests/{request_id}/accept")
async def accept_contact_request(request_id: str, user_id: str):
    """
    Accept a contact request
    """
    try:
        # Get the request
        req = await contact_requests_collection.find_one({
            "_id": ObjectId(request_id),
            "to_user_id": user_id,
            "status": "pending"
        })
        if not req:
            raise HTTPException(status_code=404, detail="Contact request not found")
        
        # Get usernames
        from_user = await users_collection.find_one({"_id": ObjectId(req["from_user_id"])})
        to_user = await users_collection.find_one({"_id": ObjectId(req["to_user_id"])})
        
        if not from_user or not to_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create both-way contacts
        contact1 = {
            "user_id": req["to_user_id"],
            "contact_user_id": req["from_user_id"],
            "contact_username": from_user["username"],
            "created_at": datetime.utcnow(),
            "is_blocked": False
        }
        contact2 = {
            "user_id": req["from_user_id"],
            "contact_user_id": req["to_user_id"],
            "contact_username": to_user["username"],
            "created_at": datetime.utcnow(),
            "is_blocked": False
        }
        
        await contacts_collection.insert_one(contact1)
        await contacts_collection.insert_one(contact2)
        
        # Update request status
        await contact_requests_collection.update_one(
            {"_id": ObjectId(request_id)},
            {
                "$set": {
                    "status": "accepted",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"message": "Contact request accepted"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/requests/{request_id}/reject")
async def reject_contact_request(request_id: str, user_id: str):
    """
    Reject a contact request
    """
    try:
        # Get the request
        req = await contact_requests_collection.find_one({
            "_id": ObjectId(request_id),
            "to_user_id": user_id,
            "status": "pending"
        })
        if not req:
            raise HTTPException(status_code=404, detail="Contact request not found")
        
        # Update request status
        await contact_requests_collection.update_one(
            {"_id": ObjectId(request_id)},
            {
                "$set": {
                    "status": "rejected",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"message": "Contact request rejected"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{user_id}/{contact_id}")
async def remove_contact(user_id: str, contact_id: str):
    """
    Remove a contact
    """
    try:
        # Remove both-way contacts
        await contacts_collection.delete_one({
            "user_id": user_id,
            "contact_user_id": contact_id
        })
        await contacts_collection.delete_one({
            "user_id": contact_id,
            "contact_user_id": user_id
        })
        
        return {"message": "Contact removed"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}/{contact_id}/block")
async def block_contact(user_id: str, contact_id: str):
    """
    Block a contact
    """
    try:
        result = await contacts_collection.update_one(
            {
                "user_id": user_id,
                "contact_user_id": contact_id
            },
            {"$set": {"is_blocked": True}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        return {"message": "Contact blocked"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}/{contact_id}/unblock")
async def unblock_contact(user_id: str, contact_id: str):
    """
    Unblock a contact
    """
    try:
        result = await contacts_collection.update_one(
            {
                "user_id": user_id,
                "contact_user_id": contact_id
            },
            {"$set": {"is_blocked": False}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        return {"message": "Contact unblocked"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
