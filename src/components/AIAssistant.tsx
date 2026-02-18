import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { sendAIMessage, getAIHistory } from '../services/aiService'
import VoiceRecorder from './VoiceRecorder'

interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const AIAssistant = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadHistory = async () => {
    if (!user) return
    try {
      const history = await getAIHistory(user.user_id)
      setMessages(history)
    } catch (err) {
      console.error('Failed to load history:', err)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !user || loading) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await sendAIMessage(user.user_id, input)
      
      const aiMessage: AIMessage = {
        id: response.message_id,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (err) {
      console.error('AI message failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleVoiceTranscript = (text: string) => {
    setInput(text)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#1a1a2e'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: '#16213e'
      }}>
        <div style={{ fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🤖 AI Assistant
        </div>
        <div style={{ fontSize: '12px', color: '#4a5568', marginTop: '4px' }}>
          Powered by ChatGPT
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#4a5568',
            marginTop: '40px',
            fontSize: '14px'
          }}>
            👋 Hi! I'm your AI assistant. Ask me anything or use voice input!
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            {/* Avatar */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: msg.role === 'assistant' 
                ? 'linear-gradient(135deg, #7c3aed, #5b21b6)'
                : 'linear-gradient(135deg, #e94560, #c62a47)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0
            }}>
              {msg.role === 'assistant' ? '🤖' : '👤'}
            </div>

            {/* Message */}
            <div style={{
              maxWidth: '70%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #e94560, #c62a47)'
                : 'rgba(255,255,255,0.07)',
              border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
              fontSize: '14px',
              lineHeight: '1.5',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap'
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              🤖
            </div>
            <div style={{
              padding: '10px 14px',
              borderRadius: '16px 16px 16px 4px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <span style={{ animation: 'pulse 1.5s infinite' }}>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: '#16213e',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <VoiceRecorder 
          onTranscript={handleVoiceTranscript}
          disabled={loading}
        />
        
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask AI anything or use voice..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: '#ffffff',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={{
            padding: '12px 20px',
            background: input.trim() && !loading
              ? 'linear-gradient(135deg, #e94560, #c62a47)'
              : 'rgba(255,255,255,0.07)',
            border: 'none',
            borderRadius: '12px',
            color: input.trim() ? '#ffffff' : '#4a5568',
            fontSize: '14px',
            fontWeight: '600',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed'
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default AIAssistant