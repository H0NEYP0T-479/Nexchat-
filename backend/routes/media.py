from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import Optional
from datetime import datetime
from pathlib import Path
import os
from database import db
from services.storage_service import storage_service

router = APIRouter(prefix="/media", tags=["media"])

# Collection for tracking uploaded media
media_collection = db["media"]

@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    description: Optional[str] = Form(None)
):
    """
    Upload a media file (image, video, audio, or document)
    """
    try:
        # Read file content
        file_content = await file.read()
        
        # Save file using storage service
        file_metadata = await storage_service.save_file(
            file_content,
            file.filename,
            user_id
        )
        
        # Get file type
        file_type = storage_service.get_file_type(file.filename)
        
        # Save metadata to database
        media_record = {
            "user_id": user_id,
            "filename": file_metadata["filename"],
            "original_filename": file_metadata["original_filename"],
            "file_type": file_type,
            "size": file_metadata["size"],
            "path": file_metadata["path"],
            "description": description,
            "uploaded_at": file_metadata["uploaded_at"]
        }
        
        result = await media_collection.insert_one(media_record)
        
        # Generate URL for accessing the file
        file_url = await storage_service.get_file_url(user_id, file_metadata["filename"])
        
        return {
            "message": "File uploaded successfully",
            "media_id": str(result.inserted_id),
            "url": file_url,
            "filename": file_metadata["filename"],
            "file_type": file_type,
            "size": file_metadata["size"]
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/{filename}")
async def get_media(user_id: str, filename: str):
    """
    Retrieve a media file
    """
    try:
        file_path = os.path.join(storage_service.upload_dir, user_id, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get media type for proper content type
        media_record = await media_collection.find_one({
            "user_id": user_id,
            "filename": filename
        })
        
        return FileResponse(
            path=file_path,
            filename=media_record.get("original_filename", filename) if media_record else filename
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}/files")
async def get_user_media(user_id: str, limit: int = 50):
    """
    Get all media files uploaded by a user
    """
    try:
        media_files = []
        cursor = media_collection.find(
            {"user_id": user_id}
        ).sort("uploaded_at", -1).limit(limit)
        
        async for media in cursor:
            file_url = await storage_service.get_file_url(user_id, media["filename"])
            media_files.append({
                "id": str(media["_id"]),
                "filename": media["filename"],
                "original_filename": media["original_filename"],
                "file_type": media["file_type"],
                "size": media["size"],
                "url": file_url,
                "description": media.get("description"),
                "uploaded_at": media["uploaded_at"]
            })
        
        return media_files
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{user_id}/{filename}")
async def delete_media(user_id: str, filename: str):
    """
    Delete a media file
    """
    try:
        # Verify the file belongs to the user
        media_record = await media_collection.find_one({
            "user_id": user_id,
            "filename": filename
        })
        
        if not media_record:
            raise HTTPException(status_code=404, detail="Media file not found")
        
        # Delete from storage
        deleted = await storage_service.delete_file(user_id, filename)
        
        if not deleted:
            raise HTTPException(status_code=500, detail="Failed to delete file from storage")
        
        # Delete from database
        await media_collection.delete_one({
            "user_id": user_id,
            "filename": filename
        })
        
        return {"message": "Media file deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
