import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { searchUsers, addContact, getContacts, deleteContact } from '../services/contactService'
import { useNavigate } from 'react-router-dom'

interface User {
  id: string
  username: string
  email: string
}

interface Contact {
  id: string
  contact_user_id: string
  contact_username: string
  contact_email: string
  is_online: boolean
}

const Contacts = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    if (!user) return
    try {
      const data = await getContacts(user.user_id)
      setContacts(data)
    } catch (err) {
      console.error('Failed to load contacts:', err)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    try {
      const results = await searchUsers(searchQuery)
      setSearchResults(results)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddContact = async (contactUserId: string) => {
    if (!user) return
    try {
      await addContact(user.user_id, contactUserId)
      alert('Contact added!')
      loadContacts()
      setSearchResults([])
      setSearchQuery('')
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Delete this contact?')) return
    try {
      await deleteContact(contactId)
      loadContacts()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const openChat = (contactId: string) => {
    navigate(`/private-chat/${contactId}`)
  }

  return (
    <div style={{
      height: '100vh',
      background: '#1a1a2e',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: '#16213e'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>Contacts</h2>
        <button
          onClick={() => navigate('/chat')}
          style={{
            marginTop: '8px',
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ← Back to Group Chat
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search users by name or email..."
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #e94560, #c62a47)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {loading ? '...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div style={{
            marginTop: '16px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            padding: '8px'
          }}>
            <div style={{ fontSize: '12px', color: '#8892b0', marginBottom: '8px', padding: '0 8px' }}>
              Search Results
            </div>
            {searchResults.map(result => (
              <div key={result.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.03)',
                marginBottom: '4px'
              }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{result.username}</div>
                  <div style={{ fontSize: '12px', color: '#8892b0' }}>{result.email}</div>
                </div>
                <button
                  onClick={() => handleAddContact(result.id)}
                  style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #48bb78, #38a169)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contacts List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 20px 20px'
      }}>
        <div style={{ fontSize: '12px', color: '#8892b0', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Your Contacts ({contacts.length})
        </div>

        {contacts.length === 0 && (
          <div style={{ textAlign: 'center', color: '#4a5568', marginTop: '40px' }}>
            No contacts yet. Search and add someone!
          </div>
        )}

        {contacts.map(contact => (
          <div key={contact.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            marginBottom: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => openChat(contact.contact_user_id)}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0f3460, #16213e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '16px',
                position: 'relative'
              }}>
                {contact.contact_username[0].toUpperCase()}
                {contact.is_online && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '12px',
                    height: '12px',
                    background: '#48bb78',
                    border: '2px solid #16213e',
                    borderRadius: '50%'
                  }} />
                )}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>{contact.contact_username}</div>
                <div style={{ fontSize: '12px', color: '#8892b0' }}>{contact.contact_email}</div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteContact(contact.id)
              }}
              style={{
                padding: '6px 12px',
                background: 'rgba(233,69,96,0.15)',
                border: 'none',
                borderRadius: '6px',
                color: '#e94560',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Contacts