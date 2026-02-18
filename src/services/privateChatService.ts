const BASE_URL = 'http://localhost:8000'

export const sendPrivateMessage = async (senderId: string, receiverId: string, text: string) => {
  const res = await fetch(`${BASE_URL}/private/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender_id: senderId,
      receiver_id: receiverId,
      text,
      message_type: 'text'
    })
  })
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}

export const getPrivateMessages = async (userId: string, contactId: string) => {
  const res = await fetch(`${BASE_URL}/private/messages/${userId}/${contactId}`)
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json()
}

export const getConversations = async (userId: string) => {
  const res = await fetch(`${BASE_URL}/private/conversations/${userId}`)
  if (!res.ok) throw new Error('Failed to fetch conversations')
  return res.json()
}

export const updateMessageStatus = async (messageId: string, status: string) => {
  const res = await fetch(`${BASE_URL}/private/messages/${messageId}/status?status=${status}`, {
    method: 'PUT'
  })
  if (!res.ok) throw new Error('Failed to update status')
  return res.json()
}