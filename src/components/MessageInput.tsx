import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import styles from './MessageInput.module.css'

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
    <div className={styles.inputContainer}>
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message... (Enter to send)"
        disabled={disabled}
        className={styles.input}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        className={`${styles.sendButton} ${text.trim() && !disabled ? styles.enabled : styles.disabled}`}
      >
        Send ➤
      </button>
    </div>
  )
}

export default MessageInput