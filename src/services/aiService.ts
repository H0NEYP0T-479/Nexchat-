const BASE_URL = 'http://localhost:8000'

export const transcribeVoice = async (audioBlob: Blob, userId: string) => {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'voice.webm')
  formData.append('user_id', userId)

  const res = await fetch(`${BASE_URL}/ai/voice-to-text`, {
    method: 'POST',
    body: formData
  })

  if (!res.ok) throw new Error('Transcription failed')
  return res.json()
}

export const sendAIMessage = async (userId: string, message: string) => {
  const res = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, message })
  })

  if (!res.ok) throw new Error('AI chat failed')
  return res.json()
}

export const getAIHistory = async (userId: string) => {
  const res = await fetch(`${BASE_URL}/ai/history/${userId}`)
  if (!res.ok) throw new Error('Failed to fetch AI history')
  return res.json()
}

export const textToSpeech = async (text: string) => {
  const res = await fetch(`${BASE_URL}/ai/text-to-speech?text=${encodeURIComponent(text)}`, {
    method: 'POST'
  })
  if (!res.ok) throw new Error('TTS failed')
  return res.json()
}