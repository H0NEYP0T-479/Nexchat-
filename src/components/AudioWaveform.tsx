import { useEffect, useRef } from 'react'

interface AudioWaveformProps {
  audioBlob?: Blob
  audioUrl?: string
  isRecording?: boolean
}

const AudioWaveform = ({ audioBlob, audioUrl, isRecording }: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (isRecording) {
      startVisualization()
    } else {
      stopVisualization()
    }

    return () => {
      stopVisualization()
    }
  }, [isRecording])

  const startVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)

      analyser.fftSize = 256
      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      draw()
    } catch (error) {
      console.error('Error setting up audio visualization:', error)
    }
  }

  const stopVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
  }

  const draw = () => {
    if (!analyserRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const WIDTH = canvas.width
    const HEIGHT = canvas.height

    const drawFrame = () => {
      animationFrameRef.current = requestAnimationFrame(drawFrame)

      analyserRef.current!.getByteFrequencyData(dataArray)

      canvasCtx.fillStyle = 'rgb(240, 240, 240)'
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)

      const barWidth = (WIDTH / bufferLength) * 2.5
      let barHeight
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * HEIGHT * 0.8

        const gradient = canvasCtx.createLinearGradient(0, HEIGHT - barHeight, 0, HEIGHT)
        gradient.addColorStop(0, '#007bff')
        gradient.addColorStop(1, '#0056b3')

        canvasCtx.fillStyle = gradient
        canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }
    }

    drawFrame()
  }

  return (
    <div style={{
      width: '100%',
      padding: '10px',
      backgroundColor: '#f0f0f0',
      borderRadius: '8px'
    }}>
      {isRecording ? (
        <canvas
          ref={canvasRef}
          width={400}
          height={100}
          style={{
            width: '100%',
            height: '100px',
            borderRadius: '4px'
          }}
        />
      ) : audioUrl || audioBlob ? (
        <audio
          controls
          src={audioUrl || (audioBlob ? URL.createObjectURL(audioBlob) : '')}
          style={{
            width: '100%'
          }}
        />
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '30px',
          color: '#888'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎤</div>
          <div>No audio to display</div>
        </div>
      )}
    </div>
  )
}

export default AudioWaveform
