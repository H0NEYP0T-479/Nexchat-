import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIAssistantProps {
  conversationId?: string
  onClose?: () => void
}

const AIAssistant = ({ conversationId, onClose }: AIAssistantProps) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState(conversationId)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (currentConversationId) {
      loadConversationMessages(currentConversationId)
    }
  }, [currentConversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversationMessages = async (convId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/ai/conversation/${convId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        })))
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !user) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          user_id: user.user_id,
          conversation_id: currentConversationId
        })
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(data.timestamp)
        }
        setMessages(prev => [...prev, assistantMessage])
        if (!currentConversationId) {
          setCurrentConversationId(data.conversation_id)
        }
      } else {
        throw new Error('Failed to get AI response')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '15px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0 }}>🤖 AI Assistant</h3>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
            Ask me anything!
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        )}
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
            <p>👋 Hello! I'm your AI assistant.</p>
            <p>How can I help you today?</p>
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '70%'
            }}
          >
            <div
              style={{
                padding: '10px 15px',
                borderRadius: '12px',
                backgroundColor: message.role === 'user' ? '#007bff' : '#f0f0f0',
                color: message.role === 'user' ? 'white' : 'black',
                wordWrap: 'break-word'
              }}
            >
              {message.content}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#888',
              marginTop: '5px',
              textAlign: message.role === 'user' ? 'right' : 'left'
            }}>
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: 'flex-start',
            padding: '10px 15px',
            borderRadius: '12px',
            backgroundColor: '#f0f0f0'
          }}>
            <span>Typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        style={{
          padding: '15px',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          gap: '10px'
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
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
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: loading || !input.trim() ? 0.6 : 1
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default AIAssistant
