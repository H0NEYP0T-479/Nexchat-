import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

interface MediaUploadProps {
  onUploadComplete?: (fileUrl: string, fileType: string) => void
  acceptedTypes?: string
}

const MediaUpload = ({ onUploadComplete, acceptedTypes }: MediaUploadProps) => {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setFileType('image')
    } else if (file.type.startsWith('audio/')) {
      setFileType('audio')
      setPreview(null)
    } else if (file.type.startsWith('video/')) {
      setFileType('video')
      setPreview(null)
    } else {
      setFileType('document')
      setPreview(null)
    }
  }

  const handleUpload = async () => {
    if (!user || !fileInputRef.current?.files?.[0]) return

    const file = fileInputRef.current.files[0]
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('user_id', user.user_id)

      const response = await fetch('http://localhost:8000/media/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        onUploadComplete?.(data.url, data.file_type)
        // Reset
        setPreview(null)
        setFileType('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        const error = await response.json()
        alert(error.detail || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    setPreview(null)
    setFileType('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px'
    }}>
      <div style={{
        marginBottom: '15px'
      }}>
        <label
          htmlFor="file-upload"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📎 Choose File
        </label>
        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={acceptedTypes || 'image/*,audio/*,video/*,.pdf,.doc,.docx,.txt'}
          style={{ display: 'none' }}
        />
      </div>

      {preview && (
        <div style={{
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          <img
            src={preview}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '200px',
              borderRadius: '8px'
            }}
          />
        </div>
      )}

      {fileType && !preview && (
        <div style={{
          padding: '20px',
          backgroundColor: '#e9ecef',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '15px'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>
            {fileType === 'audio' && '🎵'}
            {fileType === 'video' && '🎥'}
            {fileType === 'document' && '📄'}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {fileInputRef.current?.files?.[0]?.name}
          </div>
        </div>
      )}

      {(preview || fileType) && (
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center'
        }}>
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: uploading ? 0.6 : 1
            }}
          >
            {uploading ? 'Uploading...' : '⬆ Upload'}
          </button>
          <button
            onClick={handleCancel}
            disabled={uploading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: uploading ? 0.6 : 1
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

export default MediaUpload
