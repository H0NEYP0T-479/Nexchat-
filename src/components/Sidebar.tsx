import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

interface Room {
  id: string
  name: string
  description: string
}

interface SidebarProps {
  rooms: Room[]
  activeRoom: string
  onRoomSelect: (roomId: string) => void
}

const Sidebar = ({ rooms, activeRoom, onRoomSelect }: SidebarProps) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{
      width: '260px',
      background: '#16213e',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ fontSize: '22px', fontWeight: '700', color: '#e94560' }}>
          💬 Nexchat
        </div>
      </div>

      {/* Rooms */}
      <div style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        <div style={{ color: '#4a5568', fontSize: '11px', fontWeight: '600',
          padding: '0 12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Channels
        </div>
        {rooms.map(room => (
          <div
            key={room.id}
            onClick={() => onRoomSelect(room.id)}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '2px',
              background: activeRoom === room.id ? 'rgba(233,69,96,0.15)' : 'transparent',
              color: activeRoom === room.id ? '#e94560' : '#8892b0',
              fontWeight: activeRoom === room.id ? '600' : '400',
              transition: 'all 0.15s'
            }}
          >
            # {room.name}
            <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '2px' }}>
              {room.description}
            </div>
          </div>
        ))}
      </div>

      {/* User info + logout */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #e94560, #c62a47)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '700', fontSize: '14px'
          }}>
            {user?.username[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>{user?.username}</div>
            <div style={{ fontSize: '11px', color: '#4a5568' }}>Online</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(233,69,96,0.15)', border: 'none',
            color: '#e94560', padding: '6px 10px', borderRadius: '6px',
            cursor: 'pointer', fontSize: '12px', fontWeight: '600'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default Sidebar