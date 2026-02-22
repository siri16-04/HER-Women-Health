import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react'
import type { BiometricReading, BiometricSummary } from '../types'

interface BiometricState {
  isScanning: boolean
  currentBpm: number | null
  currentHrv: number | null
  currentConfidence: number
  readings: BiometricReading[]
  scanStartTime: number | null
  error: string | null
  elapsedSeconds: number
}

interface BiometricContextValue extends BiometricState {
  startScan: () => void
  stopScan: () => void
  addReading: (reading: BiometricReading) => void
  getSummary: () => BiometricSummary | null
  setServerSummary: (summary: BiometricSummary) => void
  resetBiometrics: () => void
  scanDuration: number
}

const initialState: BiometricState = {
  isScanning: false,
  currentBpm: null,
  currentHrv: null,
  currentConfidence: 0,
  readings: [],
  scanStartTime: null,
  error: null,
  elapsedSeconds: 0,
}

const BiometricContext = createContext<BiometricContextValue | null>(null)

export function BiometricProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BiometricState>(initialState)
  const scanStartTimeRef = useRef<number | null>(null)
  const serverSummaryRef = useRef<BiometricSummary | null>(null)

  const startScan = useCallback(() => {
    const now = Date.now()
    scanStartTimeRef.current = now
    setState(prev => ({
      ...prev,
      isScanning: true,
      scanStartTime: now,
      readings: [],
      error: null,
    }))
  }, [])

  const stopScan = useCallback(() => {
    setState(prev => ({
      ...prev,
      isScanning: false,
    }))
  }, [])

  const addReading = useCallback((reading: BiometricReading) => {
    setState(prev => ({
      ...prev,
      currentBpm: reading.bpm,
      currentHrv: reading.hrv,
      currentConfidence: reading.confidence,
      readings: [...prev.readings, reading],
    }))
  }, [])

  const getSummary = useCallback((): BiometricSummary | null => {
    // Prefer the server-provided Presage summary if available
    if (serverSummaryRef.current) return serverSummaryRef.current

    const { readings, scanStartTime } = state
    if (readings.length === 0) return null

    const validReadings = readings.filter(r => r.confidence > 0.7)
    if (validReadings.length === 0) return null

    const bpmValues = validReadings.map(r => r.bpm)
    const hrvValues = validReadings.map(r => r.hrv)

    return {
      avgBpm: Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length),
      avgHrv: Math.round(hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length),
      minBpm: Math.min(...bpmValues),
      maxBpm: Math.max(...bpmValues),
      scanDuration: scanStartTime ? Math.round((Date.now() - scanStartTime) / 1000) : 0,
      totalReadings: readings.length,
      validReadings: validReadings.length,
    }
  }, [state])

  const setServerSummary = useCallback((summary: BiometricSummary) => {
    serverSummaryRef.current = summary
  }, [])

  const resetBiometrics = useCallback(() => {
    scanStartTimeRef.current = null
    serverSummaryRef.current = null
    setState(initialState)
  }, [])

  // Timer to update elapsed seconds during scan
  useEffect(() => {
    let interval: number | undefined

    if (state.isScanning && state.scanStartTime) {
      interval = window.setInterval(() => {
        setState(prev => ({
          ...prev,
          elapsedSeconds: Math.round((Date.now() - (prev.scanStartTime || 0)) / 1000),
        }))
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [state.isScanning, state.scanStartTime])

  const scanDuration = state.elapsedSeconds

  return (
    <BiometricContext.Provider
      value={{
        ...state,
        startScan,
        stopScan,
        addReading,
        getSummary,
        setServerSummary,
        resetBiometrics,
        scanDuration,
      }}
    >
      {children}
    </BiometricContext.Provider>
  )
}

export function useBiometrics() {
  const context = useContext(BiometricContext)
  if (!context) {
    throw new Error('useBiometrics must be used within a BiometricProvider')
  }
  return context
}
