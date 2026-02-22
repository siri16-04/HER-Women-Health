import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import type { ScanPhase } from '../types'

interface SessionState {
  scanPhase: ScanPhase
  audioPlaying: boolean
  cameraActive: boolean
  cameraStream: MediaStream | null
  processingDiagnosis: boolean
  error: string | null
}

interface SessionContextValue extends SessionState {
  setScanPhase: (phase: ScanPhase) => void
  setAudioPlaying: (playing: boolean) => void
  initializeCamera: () => Promise<MediaStream>
  stopCamera: () => void
  setProcessingDiagnosis: (processing: boolean) => void
  setError: (error: string | null) => void
  resetSession: () => void
}

const initialState: SessionState = {
  scanPhase: 'idle',
  audioPlaying: false,
  cameraActive: false,
  cameraStream: null,
  processingDiagnosis: false,
  error: null,
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(initialState)
  const streamRef = useRef<MediaStream | null>(null)

  const setScanPhase = useCallback((phase: ScanPhase) => {
    setState(prev => ({ ...prev, scanPhase: phase }))
  }, [])

  const setAudioPlaying = useCallback((playing: boolean) => {
    setState(prev => ({ ...prev, audioPlaying: playing }))
  }, [])

  const initializeCamera = useCallback(async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 15 },
          facingMode: 'user',
        },
        audio: false,
      })
      streamRef.current = stream
      setState(prev => ({
        ...prev,
        cameraActive: true,
        cameraStream: stream,
        error: null,
      }))
      return stream
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera'
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }))
      throw err
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setState(prev => ({
      ...prev,
      cameraActive: false,
      cameraStream: null,
    }))
  }, [])

  const setProcessingDiagnosis = useCallback((processing: boolean) => {
    setState(prev => ({ ...prev, processingDiagnosis: processing }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const resetSession = useCallback(() => {
    stopCamera()
    setState(initialState)
  }, [stopCamera])

  return (
    <SessionContext.Provider
      value={{
        ...state,
        setScanPhase,
        setAudioPlaying,
        initializeCamera,
        stopCamera,
        setProcessingDiagnosis,
        setError,
        resetSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
