import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import VoiceRecorder from '../components/VoiceRecorder'
import MediaUpload from '../components/MediaUpload'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  text: string
  timestamp: string
  is_read: boolean
  media_url?: string
  media_type?: string
}

interface Contact {
  contact_username: string
  contact_user_id: string
}

const PrivateChat = () => {
  const { contactId } = useParams<{ contactId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [contact, setContact] = useState<Contact | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showMediaUpload, setShowMediaUpload] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (user && contactId) {
      loadContact()
      loadConversation()
    }
  }, [user, contactId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadContact = async () => {
    if (!user) return
    try {
      const response = await fetch(`http://localhost:8000/contacts/${user.user_id}`)
      if (response.ok) {
        const contacts = await response.json()
        const foundContact = contacts.find((c: any) => c.contact_user_id === contactId)
        if (foundContact) {
          setContact({
            contact_username: foundContact.contact_username,
            contact_user_id: foundContact.contact_user_id
          })
        }
      }
    } catch (error) {
      console.error('Error loading contact:', error)
    }
  }

  const loadConversation = async () => {
    if (!user || !contactId) return
    try {
      // In a real implementation, this would load the conversation
      // For now, we'll use a placeholder
      setConversationId(`${user.user_id}_${contactId}`)
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !user || !contactId) return

    const newMessage: Message = {
      id: Date.now().toString(),
      sender_id: user.user_id,
      receiver_id: contactId,
      text: input,
      timestamp: new Date().toISOString(),
      is_read: false
    }

    setMessages(prev => [...prev, newMessage])
    setInput('')

    // In a real implementation, this would send the message via WebSocket or API
  }

  const handleMediaUpload = (fileUrl: string, fileType: string) => {
    if (!user || !contactId) return

    const newMessage: Message = {
      id: Date.now().toString(),
      sender_id: user.user_id,
      receiver_id: contactId,
      text: `Sent a ${fileType}`,
      timestamp: new Date().toISOString(),
      is_read: false,
      media_url: fileUrl,
      media_type: fileType
    }

    setMessages(prev => [...prev, newMessage])
    setShowMediaUpload(false)
  }

  const handleVoiceRecording = (audioBlob: Blob) => {
    // In a real implementation, this would upload the audio and send it
    if (!user || !contactId) return

    const newMessage: Message = {
      id: Date.now().toString(),
      sender_id: user.user_id,
      receiver_id: contactId,
      text: 'Sent a voice message',
      timestamp: new Date().toISOString(),
      is_read: false,
      media_type: 'audio'
    }

    setMessages(prev => [...prev, newMessage])
    setShowVoiceRecorder(false)
  }

  if (!user) {
    return <div>Please log in</div>
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '80px',
        backgroundColor: '#343a40',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 10px'
      }}>
        <button
          onClick={() => navigate('/contacts')}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px'
          }}
          title="Back to Contacts"
        >
          ←
        </button>
      </div>

      {/* Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#007bff',
          color: 'white'
        }}>
          <h2 style={{ margin: 0 }}>
            {contact?.contact_username || 'Loading...'}
          </h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
            Private conversation
          </p>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {messages.length === 0 && (
            <div style={{
              textAlign: 'center',
              color: '#888',
              padding: '40px 20px'
            }}>
              No messages yet. Start the conversation!
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                alignSelf: message.sender_id === user.user_id ? 'flex-end' : 'flex-start',
                maxWidth: '70%'
              }}
            >
              <div
                style={{
                  padding: '10px 15px',
                  borderRadius: '12px',
                  backgroundColor: message.sender_id === user.user_id ? '#007bff' : '#f0f0f0',
                  color: message.sender_id === user.user_id ? 'white' : 'black',
                  wordWrap: 'break-word'
                }}
              >
                {message.media_type && (
                  <div style={{ marginBottom: '5px', fontStyle: 'italic' }}>
                    {message.media_type === 'image' && '🖼️'}
                    {message.media_type === 'audio' && '🎵'}
                    {message.media_type === 'video' && '🎥'}
                    {message.media_type === 'document' && '📄'}
                  </div>
                )}
                {message.text}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#888',
                marginTop: '5px',
                textAlign: message.sender_id === user.user_id ? 'right' : 'left'
              }}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Media Upload */}
        {showMediaUpload && (
          <div style={{ padding: '10px 20px', borderTop: '1px solid #e0e0e0' }}>
            <MediaUpload onUploadComplete={handleMediaUpload} />
          </div>
        )}

        {/* Voice Recorder */}
        {showVoiceRecorder && (
          <div style={{ padding: '10px 20px', borderTop: '1px solid #e0e0e0' }}>
            <VoiceRecorder
              onRecordingComplete={handleVoiceRecording}
              onRecordingCancel={() => setShowVoiceRecorder(false)}
            />
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: '15px',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button
              onClick={() => setShowMediaUpload(!showMediaUpload)}
              style={{
                padding: '8px 16px',
                backgroundColor: showMediaUpload ? '#dc3545' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {showMediaUpload ? '✕ Close' : '📎 Media'}
            </button>
            <button
              onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
              style={{
                padding: '8px 16px',
                backgroundColor: showVoiceRecorder ? '#dc3545' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {showVoiceRecorder ? '✕ Close' : '🎤 Voice'}
            </button>
          </div>
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '10px 15px',
                border: '1px solid #ddd',
                borderRadius: '20px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                cursor: !input.trim() ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: !input.trim() ? 0.6 : 1
              }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PrivateChat
