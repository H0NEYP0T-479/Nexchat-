import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

interface Message {
  id: string
  sender: string
  sender_id: string
  text: string
  timestamp: string
}

interface MessageListProps {
  messages: Message[]
}

const MessageList = ({ messages }: MessageListProps) => {
  const { user } = useAuth()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
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
          textAlign: 'center', color: '#4a5568',
          marginTop: '40px', fontSize: '14px'
        }}>
          No messages yet. Say hello! 👋
        </div>
      )}

      {messages.map(msg => {
        const isOwn = msg.sender_id === user?.user_id
        return (
          <div key={msg.id} style={{
            display: 'flex',
            flexDirection: isOwn ? 'row-reverse' : 'row',
            alignItems: 'flex-end',
            gap: '8px'
          }}>
            {/* Avatar */}
            {!isOwn && (
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #0f3460, #16213e)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: '700', flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                {msg.sender[0].toUpperCase()}
              </div>
            )}

            {/* Message bubble */}
            <div style={{ maxWidth: '65%' }}>
              {!isOwn && (
                <div style={{ fontSize: '11px', color: '#8892b0', marginBottom: '4px', paddingLeft: '4px' }}>
                  {msg.sender}
                </div>
              )}
              <div style={{
                padding: '10px 14px',
                borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isOwn
                  ? 'linear-gradient(135deg, #e94560, #c62a47)'
                  : 'rgba(255,255,255,0.07)',
                border: isOwn ? 'none' : '1px solid rgba(255,255,255,0.08)',
                fontSize: '14px',
                lineHeight: '1.5',
                wordBreak: 'break-word'
              }}>
                {msg.text}
              </div>
              <div style={{
                fontSize: '10px', color: '#4a5568',
                marginTop: '4px',
                textAlign: isOwn ? 'right' : 'left',
                paddingLeft: '4px', paddingRight: '4px'
              }}>
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}

export default MessageList