const BASE_URL = 'http://localhost:8000'

export const searchUsers = async (query: string) => {
  const res = await fetch(`${BASE_URL}/contacts/search?query=${query}`)
  if (!res.ok) throw new Error('Search failed')
  return res.json()
}

export const addContact = async (userId: string, contactUserId: string) => {
  const res = await fetch(`${BASE_URL}/contacts/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, contact_user_id: contactUserId })
  })
  if (!res.ok) throw new Error('Failed to add contact')
  return res.json()
}

export const getContacts = async (userId: string) => {
  const res = await fetch(`${BASE_URL}/contacts/list/${userId}`)
  if (!res.ok) throw new Error('Failed to fetch contacts')
  return res.json()
}

export const deleteContact = async (contactId: string) => {
  const res = await fetch(`${BASE_URL}/contacts/${contactId}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete contact')
  return res.json()
}