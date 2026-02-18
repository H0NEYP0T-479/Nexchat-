import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import styles from './MessageList.module.css'

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
    <div className={styles.messageList}>
      {messages.length === 0 && (
        <div className={styles.emptyState}>
          No messages yet. Say hello! 👋
        </div>
      )}

      {messages.map(msg => {
        const isOwn = msg.sender_id === user?.user_id
        return (
          <div key={msg.id} className={`${styles.messageWrapper} ${isOwn ? styles.own : ''}`}>
            {/* Avatar */}
            {!isOwn && (
              <div className={styles.avatar}>
                {msg.sender[0].toUpperCase()}
              </div>
            )}

            {/* Message bubble */}
            <div className={styles.messageContent}>
              {!isOwn && (
                <div className={styles.senderName}>
                  {msg.sender}
                </div>
              )}
              <div className={`${styles.messageBubble} ${isOwn ? styles.own : styles.other}`}>
                {msg.text}
              </div>
              <div className={`${styles.timestamp} ${isOwn ? styles.own : styles.other}`}>
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