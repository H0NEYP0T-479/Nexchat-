import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import ContactList from '../components/ContactList'
import { useNavigate } from 'react-router-dom'

interface Contact {
  id: string
  contact_user_id: string
  contact_username: string
  nickname?: string
  is_online: boolean
}

const Contacts = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact)
    // Navigate to private chat with this contact
    navigate(`/private-chat/${contact.contact_user_id}`)
  }

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#888'
      }}>
        Please log in to view contacts
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Sidebar with back button */}
      <div style={{
        width: '80px',
        backgroundColor: '#343a40',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 10px'
      }}>
        <button
          onClick={() => navigate('/chat')}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            marginBottom: '20px'
          }}
          title="Back to Chat"
        >
          ←
        </button>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: '#007bff',
          color: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '24px',
          marginBottom: '20px'
        }}>
          👥
        </div>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 30px',
          backgroundColor: 'white',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#333' }}>
            My Contacts
          </h1>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            Manage your contacts and friend requests
          </p>
        </div>

        {/* Contact List */}
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          margin: '20px 30px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <ContactList onContactSelect={handleContactSelect} />
        </div>
      </div>
    </div>
  )
}

export default Contacts
