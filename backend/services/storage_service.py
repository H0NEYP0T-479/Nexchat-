from typing import Optional, BinaryIO
import os
from datetime import datetime
from pathlib import Path
import hashlib
import shutil
from dotenv import load_dotenv

load_dotenv()

class StorageService:
    """Service for handling file uploads and media storage"""
    
    def __init__(self):
        self.upload_dir = os.getenv("UPLOAD_DIR", "uploads")
        self.max_file_size = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB default
        self.allowed_extensions = set([
            'jpg', 'jpeg', 'png', 'gif', 'webp',  # Images
            'mp4', 'webm', 'mov',  # Videos
            'mp3', 'wav', 'ogg', 'm4a',  # Audio
            'pdf', 'doc', 'docx', 'txt'  # Documents
        ])
        
        # Create upload directory if it doesn't exist
        Path(self.upload_dir).mkdir(parents=True, exist_ok=True)
    
    def is_allowed_file(self, filename: str) -> bool:
        """Check if file extension is allowed"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in self.allowed_extensions
    
    def generate_filename(self, original_filename: str) -> str:
        """Generate unique filename using timestamp and hash"""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        name, ext = os.path.splitext(original_filename)
        hash_val = hashlib.md5(f"{name}{timestamp}".encode()).hexdigest()[:8]
        return f"{timestamp}_{hash_val}{ext}"
    
    async def save_file(
        self, 
        file_data: bytes,
        filename: str,
        user_id: str
    ) -> dict:
        """
        Save uploaded file to storage
        
        Args:
            file_data: File content as bytes
            filename: Original filename
            user_id: ID of user uploading the file
            
        Returns:
            Dictionary with file metadata
        """
        if not self.is_allowed_file(filename):
            raise ValueError(f"File type not allowed: {filename}")
        
        if len(file_data) > self.max_file_size:
            raise ValueError(f"File size exceeds maximum allowed size")
        
        # Generate unique filename
        unique_filename = self.generate_filename(filename)
        
        # Create user directory
        user_dir = os.path.join(self.upload_dir, user_id)
        Path(user_dir).mkdir(parents=True, exist_ok=True)
        
        # Save file
        file_path = os.path.join(user_dir, unique_filename)
        with open(file_path, 'wb') as f:
            f.write(file_data)
        
        return {
            "filename": unique_filename,
            "original_filename": filename,
            "path": file_path,
            "size": len(file_data),
            "uploaded_at": datetime.utcnow(),
            "user_id": user_id
        }
    
    async def get_file_url(self, user_id: str, filename: str) -> str:
        """
        Get URL for accessing a file
        
        Args:
            user_id: ID of file owner
            filename: Name of the file
            
        Returns:
            URL to access the file
        """
        return f"/media/{user_id}/{filename}"
    
    async def delete_file(self, user_id: str, filename: str) -> bool:
        """
        Delete a file from storage
        
        Args:
            user_id: ID of file owner
            filename: Name of the file to delete
            
        Returns:
            True if file was deleted, False otherwise
        """
        file_path = os.path.join(self.upload_dir, user_id, filename)
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False
    
    def get_file_type(self, filename: str) -> str:
        """Determine file type category"""
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        
        if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
            return 'image'
        elif ext in ['mp4', 'webm', 'mov']:
            return 'video'
        elif ext in ['mp3', 'wav', 'ogg', 'm4a']:
            return 'audio'
        elif ext in ['pdf', 'doc', 'docx', 'txt']:
            return 'document'
        else:
            return 'other'

# Singleton instance
storage_service = StorageService()
