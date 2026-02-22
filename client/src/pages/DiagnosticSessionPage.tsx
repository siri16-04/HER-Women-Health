import { useEffect, useCallback, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { useBiometrics } from '../context/BiometricContext'
import { useApp } from '../context/AppContext'
import CameraView from '../components/diagnostic/CameraView'
import BiometricOverlay from '../components/diagnostic/BiometricOverlay'
import VoicePlayer from '../components/diagnostic/VoicePlayer'
import ScanProgress from '../components/diagnostic/ScanProgress'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'

const SCAN_DURATION_SECONDS = 30 // Shorter for demo

export default function DiagnosticSessionPage() {
  const navigate = useNavigate()
  const {
    lifeStage,
    selectedBodyParts,
    symptoms,
    setDiagnosisResult,
    createSession,
    saveSessionData,
  } = useApp()
  const {
    scanPhase,
    setScanPhase,
    initializeCamera,
    stopCamera,
    processingDiagnosis,
    setProcessingDiagnosis,
    error,
  } = useSession()
  const { startScan, stopScan, addReading, getSummary, scanDuration, isScanning } = useBiometrics()
  const [isInitializing, setIsInitializing] = useState(true)
  const simulationIntervalRef = useRef<number | null>(null)
  const baselineRef = useRef({ bpm: 72 + Math.random() * 10, hrv: 45 + Math.random() * 15 })
  const sessionCreatedRef = useRef(false)

  // Initialize camera on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initializeCamera()
        setIsInitializing(false)
        setScanPhase('welcome')
      } catch {
        setIsInitializing(false)
      }
    }
    init()

    return () => {
      stopCamera()
      stopScan()
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current)
      }
    }
  }, [initializeCamera, stopCamera, stopScan, setScanPhase])

  // Simulate biometric readings during scan (DEMO MODE)
  useEffect(() => {
    if (isScanning) {
      const startTime = Date.now()

      simulationIntervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000
        const baseline = baselineRef.current

        // Generate realistic-looking biometric data
        const breathingCycle = Math.sin(elapsed * 0.3) * 3
        const naturalVariation = Math.sin(elapsed * 0.1) * 2
        const noise = (Math.random() - 0.5) * 4

        const bpm = Math.round(baseline.bpm + breathingCycle + naturalVariation + noise)
        const hrv = Math.round(baseline.hrv + Math.sin(elapsed * 0.2) * 8 + (Math.random() - 0.5) * 6)
        const confidence = Math.min(0.6 + (elapsed / 30) * 0.3 + (Math.random() - 0.5) * 0.1, 0.98)

        addReading({
          bpm: Math.max(55, Math.min(110, bpm)),
          hrv: Math.max(15, Math.min(70, hrv)),
          confidence,
          timestamp: Date.now(),
        })
      }, 1000) // Update every second

      return () => {
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current)
        }
      }
    }
  }, [isScanning, addReading])

  // Handle scan phases and completion
  useEffect(() => {
    if (isScanning) {
      if (scanDuration >= SCAN_DURATION_SECONDS) {
        stopScan()
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current)
        }
        setScanPhase('complete')
      } else if (scanDuration >= SCAN_DURATION_SECONDS * 0.75) {
        setScanPhase('completing')
      } else if (scanDuration >= SCAN_DURATION_SECONDS * 0.5) {
        setScanPhase('midway')
      } else if (scanDuration > 2) {
        setScanPhase('scanning')
      }
    }
  }, [isScanning, scanDuration, stopScan, setScanPhase])

  const handleStartScanning = useCallback(async () => {
    // Create session in Supabase when scan starts
    if (!sessionCreatedRef.current) {
      sessionCreatedRef.current = true
      await createSession()
    }
    startScan()
    setScanPhase('scanning')
  }, [startScan, setScanPhase, createSession])

  // Quick test bypass - skip scanning and use sample data
  const handleQuickTest = useCallback(async () => {
    setProcessingDiagnosis(true)
    setScanPhase('analyzing')

    // Create session first
    if (!sessionCreatedRef.current) {
      sessionCreatedRef.current = true
      await createSession()
    }

    const sampleBiometrics = {
      avgBpm: 72,
      avgHrv: 45,
      minBpm: 68,
      maxBpm: 78,
      scanDuration: 30,
      totalReadings: 30,
      validReadings: 28,
    }

    try {
      console.log('Quick test - sending sample data to Gemini')
      const response = await fetch('/api/diagnosis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intake: { lifeStage, selectedBodyParts, symptoms },
          biometrics: sampleBiometrics,
        }),
      })

      const result = await response.json()
      console.log('API result:', result)

      if (result && result.urgencyLevel) {
        // Save to Supabase
        await saveSessionData(sampleBiometrics, result)
        setDiagnosisResult(result)
        navigate('/report')
      } else {
        throw new Error('Invalid response')
      }
    } catch (err) {
      console.error('Quick test error:', err)
      alert(`Error: ${err instanceof Error ? err.message : 'Failed'}`)
      setProcessingDiagnosis(false)
    }
  }, [lifeStage, selectedBodyParts, symptoms, setDiagnosisResult, setProcessingDiagnosis, setScanPhase, navigate, createSession, saveSessionData])

  const handleAnalyze = useCallback(async () => {
    setProcessingDiagnosis(true)
    setScanPhase('analyzing')

    try {
      const biometricSummary = getSummary()

      console.log('Sending to Gemini:', {
        intake: { lifeStage, selectedBodyParts, symptoms },
        biometrics: biometricSummary,
      })

      const response = await fetch('/api/diagnosis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intake: {
            lifeStage,
            selectedBodyParts,
            symptoms,
          },
          biometrics: biometricSummary,
        }),
      })

      console.log('Response status:', response.status)

      const result = await response.json()
      console.log('API result:', result)

      // Even if status is 500, we might have a fallback result we can use
      if (result && result.urgencyLevel) {
        console.log('Using result (fallback or success)')
        // Save to Supabase
        await saveSessionData(biometricSummary, result)
      } else if (!response.ok) {
        throw new Error(`Failed to analyze: ${response.status}`)
      }

      setDiagnosisResult(result)
      navigate('/report')
    } catch (err) {
      console.error('Diagnosis error:', err)
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to analyze'}. Check console for details.`)
      setProcessingDiagnosis(false)
    }
  }, [
    getSummary,
    lifeStage,
    selectedBodyParts,
    symptoms,
    setDiagnosisResult,
    setProcessingDiagnosis,
    setScanPhase,
    navigate,
    saveSessionData,
  ])

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-white">Initializing camera...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h2 className="text-lg font-medium text-red-600 mb-2">Camera Error</h2>
          <p className="text-neutral-600 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-900 relative">
      {/* Camera View */}
      <CameraView />

      {/* Biometric Overlay */}
      <BiometricOverlay />

      {/* Voice Player */}
      <VoicePlayer />

      {/* Scan Progress */}
      {isScanning && (
        <ScanProgress
          duration={SCAN_DURATION_SECONDS}
          elapsed={scanDuration}
        />
      )}

      {/* Control Panel */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="max-w-md mx-auto">
          {scanPhase === 'welcome' && (
            <div className="text-center">
              <p className="text-white mb-4">
                Position your face in the center of the screen and remain still
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="primary" size="lg" onClick={handleStartScanning}>
                  Begin Scan
                </Button>
                <Button variant="secondary" size="lg" onClick={handleQuickTest}>
                  Quick Test (Skip Scan)
                </Button>
              </div>
            </div>
          )}

          {scanPhase === 'complete' && !processingDiagnosis && (
            <div className="text-center">
              <p className="text-healing-400 mb-4">
                Scan complete! Ready to analyze your results.
              </p>
              <Button variant="primary" size="lg" onClick={handleAnalyze}>
                Analyze Results
              </Button>
            </div>
          )}

          {processingDiagnosis && (
            <div className="text-center">
              <LoadingSpinner />
              <p className="text-white mt-4">Analyzing your health data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
