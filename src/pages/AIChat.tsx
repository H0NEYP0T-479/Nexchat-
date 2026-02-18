import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AIAssistant from '../components/AIAssistant'
import { useAuth } from '../context/AuthContext'

interface Conversation {
  id: string
  title: string
  updated_at: Date
  message_count: number
}

const AIChat = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | undefined>()
  const [showSidebar, setShowSidebar] = useState(true)

  const loadConversations = async () => {
    if (!user) return
    try {
      const response = await fetch(`http://localhost:8000/ai/conversations/${user.user_id}`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const handleNewConversation = () => {
    setSelectedConversation(undefined)
  }

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId)
  }

  const handleDeleteConversation = async (conversationId: string) => {
    if (!user || !confirm('Delete this conversation?')) return

    try {
      const response = await fetch(
        `http://localhost:8000/ai/conversation/${conversationId}?user_id=${user.user_id}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        loadConversations()
        if (selectedConversation === conversationId) {
          setSelectedConversation(undefined)
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
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
        Please log in to use AI Assistant
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Navigation Sidebar */}
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
          fontSize: '24px'
        }}>
          🤖
        </div>
      </div>

      {/* Conversations Sidebar */}
      {showSidebar && (
        <div style={{
          width: '300px',
          backgroundColor: 'white',
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>AI Conversations</h3>
            <button
              onClick={handleNewConversation}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ➕ New Conversation
            </button>
            <button
              onClick={loadConversations}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                marginTop: '10px'
              }}
            >
              🔄 Refresh
            </button>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px'
          }}>
            {conversations.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#888'
              }}>
                No conversations yet. Start a new one!
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  style={{
                    padding: '12px',
                    margin: '5px 0',
                    backgroundColor: selectedConversation === conv.id ? '#e7f3ff' : '#f8f9fa',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: selectedConversation === conv.id ? '2px solid #007bff' : '1px solid #e0e0e0'
                  }}
                  onClick={() => handleSelectConversation(conv.id)}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 'bold',
                        marginBottom: '5px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {conv.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {conv.message_count} messages
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteConversation(conv.id)
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        fontSize: '18px'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white'
      }}>
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            zIndex: 10
          }}
        >
          {showSidebar ? '◀ Hide' : '▶ Show'} Conversations
        </button>

        <AIAssistant conversationId={selectedConversation} />
      </div>
    </div>
  )
}

export default AIChat
