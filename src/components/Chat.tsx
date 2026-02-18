import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMessages, getRooms } from '../services/api'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import Sidebar from './Sidebar'
import { useNavigate } from 'react-router-dom'

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
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [activeRoom, setActiveRoom] = useState('general')
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    getRooms().then(setRooms).catch(console.error)
  }, [])

  useEffect(() => {
    getMessages(activeRoom).then(setMessages).catch(console.error)

    if (wsRef.current) {
      wsRef.current.close()
    }

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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/ai')}
              style={{
                padding: '8px 12px',
                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              🤖 AI Assistant
            </button>

            <button
              onClick={() => navigate('/contacts')}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              👥 Contacts
            </button>

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
        </div>

        <MessageList messages={messages} />

        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!connected}
        />
      </div>
    </div>
  )
}

export default Chat