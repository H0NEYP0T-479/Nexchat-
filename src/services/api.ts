const BASE_URL = 'http://localhost:8000'

export const registerUser = async (username: string, email: string, password: string) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Registration failed')
  }
  return res.json()
}

export const loginUser = async (email: string, password: string) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Login failed')
  }
  return res.json()
}

export const getMessages = async (roomId: string) => {
  const res = await fetch(`${BASE_URL}/chat/messages/${roomId}`)
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json()
}

export const getRooms = async () => {
  const res = await fetch(`${BASE_URL}/chat/rooms`)
  if (!res.ok) throw new Error('Failed to fetch rooms')
  return res.json()
}