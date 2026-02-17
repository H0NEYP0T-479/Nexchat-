import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMessages, getRooms } from '../services/api'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import Sidebar from './Sidebar'

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
    <div style={{ display: 'flex', height: '100vh', background: '#1a1a2e' }}>
      <Sidebar
        rooms={rooms}
        activeRoom={activeRoom}
        onRoomSelect={setActiveRoom}
      />

      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Chat header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: '#16213e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px' }}>
              # {activeRoomData?.name || activeRoom}
            </div>
            <div style={{ fontSize: '12px', color: '#4a5568' }}>
              {activeRoomData?.description}
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', color: connected ? '#48bb78' : '#e94560'
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: connected ? '#48bb78' : '#e94560'
            }} />
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