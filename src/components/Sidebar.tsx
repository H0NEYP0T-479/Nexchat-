import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import styles from './Sidebar.module.css'

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
    <div className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logo}>
          💬 Nexchat
        </div>
      </div>

      {/* Rooms */}
      <div className={styles.roomsList}>
        <div className={styles.sectionLabel}>
          Channels
        </div>
        {rooms.map(room => (
          <div
            key={room.id}
            onClick={() => onRoomSelect(room.id)}
            className={`${styles.roomItem} ${activeRoom === room.id ? styles.active : ''}`}
          >
            # {room.name}
            <div className={styles.roomDescription}>
              {room.description}
            </div>
          </div>
        ))}
      </div>

      {/* User info + logout */}
      <div className={styles.userInfo}>
        <div className={styles.userProfile}>
          <div className={styles.avatar}>
            {user?.username[0].toUpperCase()}
          </div>
          <div className={styles.userDetails}>
            <div className={styles.username}>{user?.username}</div>
            <div className={styles.status}>Online</div>
          </div>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </div>
  )
}

export default Sidebar