from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import os
import aiofiles
from datetime import datetime
import uuid

router = APIRouter(prefix="/media", tags=["media"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {
    "image": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    "audio": [".mp3", ".wav", ".ogg", ".m4a", ".webm"],
    "video": [".mp4", ".webm", ".mov"],
    "file": [".pdf", ".doc", ".docx", ".txt", ".zip"]
}

MAX_FILE_SIZE = 50 * 1024 * 1024

@router.post("/upload")
async def upload_media(file: UploadFile = File(...), media_type: str = "image"):
    try:
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        valid_extensions = []
        for extensions in ALLOWED_EXTENSIONS.values():
            valid_extensions.extend(extensions)
        
        if file_ext not in valid_extensions:
            raise HTTPException(status_code=400, detail="File type not allowed")
        
        unique_filename = f"{uuid.uuid4()}_{datetime.utcnow().timestamp()}{file_ext}"
        filepath = os.path.join(UPLOAD_DIR, unique_filename)
        
        async with aiofiles.open(filepath, 'wb') as f:
            content = await file.read()
            
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="File too large (max 50MB)")
            
            await f.write(content)
        
        return {
            "filename": unique_filename,
            "url": f"/media/files/{unique_filename}",
            "size": len(content),
            "type": media_type
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/files/{filename}")
async def get_media(filename: str):
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(filepath)

@router.delete("/files/{filename}")
async def delete_media(filename: str):
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    
    os.remove(filepath)
    return {"message": "File deleted"}