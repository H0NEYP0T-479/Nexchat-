import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

interface Contact {
  id: string
  contact_user_id: string
  contact_username: string
  nickname?: string
  is_online: boolean
}

interface ContactRequest {
  id: string
  from_user_id: string
  from_username: string
  status: string
}

interface ContactListProps {
  onContactSelect?: (contact: Contact) => void
}

const ContactList = ({ onContactSelect }: ContactListProps) => {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [requests, setRequests] = useState<ContactRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContactUsername, setNewContactUsername] = useState('')
  const [activeTab, setActiveTab] = useState<'contacts' | 'requests'>('contacts')

  useEffect(() => {
    if (user) {
      loadContacts()
      loadContactRequests()
    }
  }, [user])

  const loadContacts = async () => {
    if (!user) return
    try {
      const response = await fetch(`http://localhost:8000/contacts/${user.user_id}`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data)
      }
    } catch (error) {
      console.error('Error loading contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadContactRequests = async () => {
    if (!user) return
    try {
      const response = await fetch(`http://localhost:8000/contacts/${user.user_id}/requests`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Error loading contact requests:', error)
    }
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newContactUsername.trim()) return

    try {
      const response = await fetch(`http://localhost:8000/contacts/${user.user_id}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: newContactUsername })
      })

      if (response.ok) {
        alert('Contact request sent!')
        setNewContactUsername('')
        setShowAddContact(false)
      } else {
        const error = await response.json()
        alert(error.detail || 'Failed to send contact request')
      }
    } catch (error) {
      console.error('Error adding contact:', error)
      alert('Failed to send contact request')
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    if (!user) return
    try {
      const response = await fetch(
        `http://localhost:8000/contacts/requests/${requestId}/accept?user_id=${user.user_id}`,
        { method: 'POST' }
      )
      if (response.ok) {
        loadContacts()
        loadContactRequests()
      }
    } catch (error) {
      console.error('Error accepting request:', error)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    if (!user) return
    try {
      const response = await fetch(
        `http://localhost:8000/contacts/requests/${requestId}/reject?user_id=${user.user_id}`,
        { method: 'POST' }
      )
      if (response.ok) {
        loadContactRequests()
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#ffffff'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <h2 style={{ margin: '0 0 15px 0' }}>Contacts</h2>
        <button
          onClick={() => setShowAddContact(!showAddContact)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ➕ Add Contact
        </button>
      </div>

      {/* Add Contact Form */}
      {showAddContact && (
        <div style={{
          padding: '15px 20px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <form onSubmit={handleAddContact} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={newContactUsername}
              onChange={(e) => setNewContactUsername(e.target.value)}
              placeholder="Enter username"
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Send Request
            </button>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <button
          onClick={() => setActiveTab('contacts')}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: activeTab === 'contacts' ? '#007bff' : 'transparent',
            color: activeTab === 'contacts' ? 'white' : '#666',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'contacts' ? 'bold' : 'normal'
          }}
        >
          Contacts ({contacts.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: activeTab === 'requests' ? '#007bff' : 'transparent',
            color: activeTab === 'requests' ? 'white' : '#666',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'requests' ? 'bold' : 'normal'
          }}
        >
          Requests ({requests.length})
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
            Loading...
          </div>
        ) : activeTab === 'contacts' ? (
          contacts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              No contacts yet. Add some contacts to start chatting!
            </div>
          ) : (
            contacts.map(contact => (
              <div
                key={contact.id}
                onClick={() => onContactSelect?.(contact)}
                style={{
                  padding: '12px 15px',
                  margin: '5px 0',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              >
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: contact.is_online ? '#28a745' : '#dc3545'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {contact.nickname || contact.contact_username}
                  </div>
                  {contact.nickname && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      @{contact.contact_username}
                    </div>
                  )}
                </div>
              </div>
            ))
          )
        ) : (
          requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              No pending contact requests
            </div>
          ) : (
            requests.map(request => (
              <div
                key={request.id}
                style={{
                  padding: '12px 15px',
                  margin: '5px 0',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  {request.from_username}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  )
}

export default ContactList
