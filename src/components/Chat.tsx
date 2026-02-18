import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMessages, getRooms } from '../services/api'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import Sidebar from './Sidebar'
import styles from './Chat.module.css'

interface Message {
  id: string
  sender: string
  sender_id: string
  text: string
  timestamp: string
}

interface Room {
  id: string
  name: string
  description: string
}

const Chat = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [activeRoom, setActiveRoom] = useState('general')
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  // Load rooms on mount
  useEffect(() => {
    getRooms().then(setRooms).catch(console.error)
  }, [])

  // Connect WebSocket and load messages when room changes
  useEffect(() => {
    // Load old messages
    getMessages(activeRoom).then(setMessages).catch(console.error)

    // Close previous WebSocket
    if (wsRef.current) {
      wsRef.current.close()
    }

    // Open new WebSocket
    const ws = new WebSocket(`ws://localhost:8000/ws/${activeRoom}`)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      setMessages(prev => [...prev, msg])
    }

    ws.onerror = (err) => console.error('WebSocket error:', err)

    return () => ws.close()
  }, [activeRoom])

  const handleSendMessage = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && user) {
      const payload = {
        sender: user.username,
        sender_id: user.user_id,
        text
      }
      wsRef.current.send(JSON.stringify(payload))
    }
  }, [user])

  const activeRoomData = rooms.find(r => r.id === activeRoom)

  return (
    <div className={styles.chatContainer}>
      <Sidebar
        rooms={rooms}
        activeRoom={activeRoom}
        onRoomSelect={setActiveRoom}
      />

      {/* Main chat area */}
      <div className={styles.mainChatArea}>
        {/* Chat header */}
        <div className={styles.chatHeader}>
          <div className={styles.roomInfo}>
            <div className={styles.roomName}>
              # {activeRoomData?.name || activeRoom}
            </div>
            <div className={styles.roomDescription}>
              {activeRoomData?.description}
            </div>
          </div>
          <div className={`${styles.connectionStatus} ${connected ? styles.connected : styles.disconnected}`}>
            <div className={`${styles.statusDot} ${connected ? styles.connected : styles.disconnected}`} />
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {/* Messages */}
        <MessageList messages={messages} />

        {/* Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!connected}
        />
      </div>
    </div>
  )
}

export default Chat