import { useState, useRef } from 'react'

interface VoiceRecorderProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

const VoiceRecorder = ({ onTranscript, disabled }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())
        
        // Send to backend for transcription
        setIsProcessing(true)
        try {
          const { transcribeVoice } = await import('../services/aiService')
          const { useAuth } = await import('../context/AuthContext')
          const result = await transcribeVoice(audioBlob, 'user_id_here') // Pass actual user ID
          onTranscript(result.text)
        } catch (err) {
          console.error('Transcription failed:', err)
        } finally {
          setIsProcessing(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
      alert('Microphone access denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {!isRecording ? (
        <button
          onClick={startRecording}
          disabled={disabled || isProcessing}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            background: disabled ? '#4a5568' : 'linear-gradient(135deg, #e94560, #c62a47)',
            color: 'white',
            fontSize: '18px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isProcessing ? '⏳' : '🎤'}
        </button>
      ) : (
        <button
          onClick={stopRecording}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            background: '#e94560',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 1.5s infinite'
          }}
        >
          ⏹️
        </button>
      )}
      {isRecording && (
        <span style={{ color: '#e94560', fontSize: '12px', animation: 'pulse 1.5s infinite' }}>
          Recording...
        </span>
      )}
      {isProcessing && (
        <span style={{ color: '#8892b0', fontSize: '12px' }}>
          Processing...
        </span>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default VoiceRecorder