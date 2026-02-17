import { useState, KeyboardEvent } from 'react'

interface MessageInputProps {
  onSendMessage: (text: string) => void
  disabled?: boolean
}

const MessageInput = ({ onSendMessage, disabled }: MessageInputProps) => {
  const [text, setText] = useState('')

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSendMessage(text.trim())
      setText('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{
      padding: '16px 20px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      background: '#16213e',
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    }}>
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message... (Enter to send)"
        disabled={disabled}
        style={{
          flex: 1,
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          color: '#ffffff',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.2s'
        }}
        onFocus={e => e.target.style.borderColor = '#e94560'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        style={{
          padding: '12px 20px',
          background: text.trim() && !disabled
            ? 'linear-gradient(135deg, #e94560, #c62a47)'
            : 'rgba(255,255,255,0.07)',
          border: 'none',
          borderRadius: '12px',
          color: text.trim() ? '#ffffff' : '#4a5568',
          fontSize: '14px',
          fontWeight: '600',
          cursor: text.trim() && !disabled ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap'
        }}
      >
        Send ➤
      </button>
    </div>
  )
}

export default MessageInput