import { useEffect, useCallback, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import VoicePlayer from '../components/diagnostic/VoicePlayer'
import { useSession } from '../context/SessionContext'
import { useBiometrics } from '../context/BiometricContext'
import LifeStageSelector from '../components/intake/LifeStageSelector'
import BodyMap from '../components/intake/BodyMap'
import SymptomPanel from '../components/intake/SymptomPanel'
import LoadingSpinner from '../components/common/LoadingSpinner'

const SCAN_DURATION_SECONDS = 60
const MIN_VIDEO_MB = 2
const MIN_VIDEO_BYTES = MIN_VIDEO_MB * 1024 * 1024

// Logo component
function Logo() {
  return (
    <img src="/logo.png" alt="HER" className="w-12 h-12 object-contain" />
  )
}

// Navigation component
function Navigation({
  activeTab,
  onTabChange,
  onLogout
}: {
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
}) {
  const tabs = [
    { id: 'analyze', label: 'Analyze Report' },
    { id: 'new', label: 'New Scan' },
    { id: 'history', label: 'View Past Scans' },
    { id: 'period', label: 'Period Tracker' },
    { id: 'wellness', label: 'Wellness' },
  ]

  return (
    <nav className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-8">
        <Logo />
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                px-4 py-2 rounded-full font-medium text-sm transition-all duration-300
                ${activeTab === tab.id
                  ? 'bg-healing-800 text-white shadow-lg shadow-healing-800/25 scale-105'
                  : 'text-healing-800 hover:bg-healing-100'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={onLogout}
        className="flex items-center gap-2 px-4 py-2 bg-healing-800 text-white rounded-lg font-medium text-sm hover:bg-healing-900 transition-all duration-300 hover:shadow-lg hover:shadow-healing-800/25"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logout
      </button>
    </nav>
  )
}

// Biometric Overlay component (on-screen stats)
function BiometricStats({
  currentBpm,
  currentHrv,
  currentConfidence,
  isScanning
}: {
  currentBpm: number | null
  currentHrv: number | null
  currentConfidence: number
  isScanning: boolean
}) {
  if (!isScanning) return null

  return (
    <div className="absolute top-4 left-4 space-y-3 z-10">
      {/* BPM Card */}
      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 min-w-[140px]">
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <div className="absolute inset-0 animate-ping">
              <svg className="w-5 h-5 text-red-500/50" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-xs text-neutral-400 uppercase">Heart Rate</p>
            <p className="text-xl font-semibold text-white">
              {currentBpm !== null ? `${Math.round(currentBpm)}` : '--'}
              <span className="text-sm font-normal text-neutral-400 ml-1">BPM</span>
            </p>
          </div>
        </div>
      </div>

      {/* HRV Card */}
      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 min-w-[140px]">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-clinical-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <div>
            <p className="text-xs text-neutral-400 uppercase">HRV</p>
            <p className="text-xl font-semibold text-white">
              {currentHrv !== null ? `${Math.round(currentHrv)}` : '--'}
              <span className="text-sm font-normal text-neutral-400 ml-1">ms</span>
            </p>
          </div>
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
        <p className="text-xs text-neutral-400 uppercase mb-1">Signal Quality</p>
        <div className="flex gap-1">
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold, i) => (
            <div
              key={i}
              className={`h-2 w-4 rounded-sm transition-colors ${currentConfidence >= threshold ? 'bg-healing-500' : 'bg-neutral-600'
                }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Camera view for biometric scan
function CameraViewSection({
  isScanning,
  scanDuration,
  scanPhase,
  currentBpm,
  currentHrv,
  currentConfidence,
  onStartRecording,
  onAnalyze,
  processingDiagnosis,
  scanError
}: {
  isScanning: boolean
  scanDuration: number
  scanPhase: string
  currentBpm: number | null
  currentHrv: number | null
  currentConfidence: number
  onStartRecording: () => void
  onAnalyze: () => void
  processingDiagnosis: boolean
  scanError: string | null
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { cameraStream } = useSession()
  const [cameraReady, setCameraReady] = useState(false)
  const progress = (scanDuration / SCAN_DURATION_SECONDS) * 100

  // Connect camera stream to video element
  useEffect(() => {
    const video = videoRef.current
    if (video && cameraStream) {
      video.srcObject = cameraStream

      const handleCanPlay = () => {
        setCameraReady(true)
      }

      video.addEventListener('canplay', handleCanPlay)

      // Also set ready immediately if stream is active
      if (cameraStream.active) {
        setCameraReady(true)
      }

      return () => {
        video.removeEventListener('canplay', handleCanPlay)
      }
    }
  }, [cameraStream])

  return (
    <div className="flex flex-col items-center animate-fade-in">
      {/* Camera container */}
      <div className="relative w-full max-w-2xl aspect-video bg-neutral-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Video feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />

        {/* Loading overlay when camera not ready */}
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-800/90 z-20">
            <div className="text-center">
              <LoadingSpinner />
              <p className="mt-3 text-white/70 text-sm">Starting camera...</p>
            </div>
          </div>
        )}

        {/* Face guide overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            {/* Oval guide */}
            <div
              className="w-40 h-56 md:w-48 md:h-64 border-2 border-dashed border-white/60 rounded-[50%]"
              style={{
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.2)',
              }}
            />
            {/* Corner guides */}
            <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-healing-400 rounded-tl-lg" />
            <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-healing-400 rounded-tr-lg" />
            <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-healing-400 rounded-bl-lg" />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-healing-400 rounded-br-lg" />
          </div>
        </div>

        {/* Simulated biometric stats removed — real vitals come from Presage SDK after scan completes */}

        {/* Progress bar (during scanning) */}
        {isScanning && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/30">
            <div
              className="h-full bg-healing-500 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Instruction overlay at bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-neutral-600/90 backdrop-blur-sm text-white text-center py-3 px-4 rounded-lg">
            {isScanning ? (
              <p className="text-sm">
                Hold still... <span className="font-semibold">{Math.max(0, SCAN_DURATION_SECONDS - scanDuration)}s</span> remaining
              </p>
            ) : scanPhase === 'complete' ? (
              <p className="text-sm">Scan complete! Click the button below to analyze your results.</p>
            ) : (
              <p className="text-sm">
                Position your face in the circle, then click <span className="font-semibold">"Start Recording"</span> below.
              </p>
            )}
            {scanError && (
              <p className="mt-2 text-xs text-amber-200">{scanError}</p>
            )}
          </div>
        </div>

        {/* Camera ready indicator */}
        {cameraReady && !isScanning && scanPhase !== 'complete' && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-white text-xs">Camera Ready</span>
          </div>
        )}
      </div>

      {/* Action button - always visible */}
      <div className="mt-6 pb-4">
        {processingDiagnosis ? (
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner />
            <p className="text-neutral-600">Analyzing your health data...</p>
          </div>
        ) : scanPhase === 'complete' ? (
          <button
            onClick={onAnalyze}
            className="px-8 py-4 bg-healing-700 hover:bg-healing-800 text-white font-semibold text-lg rounded-full
                       transition-all duration-300 hover:shadow-xl hover:shadow-healing-700/30 active:scale-95"
          >
            Analyze Results
          </button>
        ) : isScanning ? (
          <div className="flex items-center gap-3 px-8 py-4 bg-healing-600 text-white font-semibold text-lg rounded-full">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            Recording...
          </div>
        ) : (
          <button
            onClick={onStartRecording}
            className="px-8 py-4 bg-healing-700 hover:bg-healing-800 text-white font-semibold text-lg rounded-full
                       transition-all duration-300 hover:shadow-xl hover:shadow-healing-700/30 active:scale-95"
          >
            Start Recording
          </button>
        )}
      </div>
    </div>
  )
}

// Intake Step component
function IntakeStep({
  onContinue,
  canProceed,
  lifeStage,
  selectedBodyParts
}: {
  onContinue: () => void
  canProceed: boolean
  lifeStage: string | null
  selectedBodyParts: string[]
}) {
  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Body Map */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-neutral-100">
          <h2 className="text-lg font-semibold text-healing-800 mb-2">
            Select Affected Areas
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            Click on the body regions where you are experiencing symptoms
          </p>
          <BodyMap />
        </div>

        {/* Right Column - Life Stage & Symptoms */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-md p-6 border border-neutral-100">
            <h2 className="text-lg font-semibold text-healing-800 mb-2">
              Life Stage
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              Select your current life stage for more accurate assessment
            </p>
            <LifeStageSelector />
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 border border-neutral-100">
            <h2 className="text-lg font-semibold text-healing-800 mb-2">
              Symptom Details
            </h2>
            <SymptomPanel />
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={onContinue}
          disabled={!canProceed}
          className={`
            px-8 py-4 font-semibold text-lg rounded-full transition-all duration-300
            ${canProceed
              ? 'bg-healing-700 hover:bg-healing-800 text-white hover:shadow-xl hover:shadow-healing-700/30 active:scale-95'
              : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
            }
          `}
        >
          {canProceed
            ? 'Continue to Biometric Scan'
            : `Select ${!lifeStage ? 'life stage' : ''}${!lifeStage && selectedBodyParts.length === 0 ? ' and ' : ''}${selectedBodyParts.length === 0 ? 'body areas' : ''}`}
        </button>
      </div>
    </div>
  )
}

export default function IntakePage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const {
    lifeStage,
    selectedBodyParts,
    symptoms,
    currentMedications,
    canProceedToScan,
    setDiagnosisResult,
    createSession,
    saveSessionData,
  } = useApp()
  const {
    scanPhase,
    setScanPhase,
    initializeCamera,
    stopCamera,
    cameraStream,
    processingDiagnosis,
    setProcessingDiagnosis,
    error: cameraError,
  } = useSession()
  const {
    startScan,
    stopScan,
    getSummary,
    setServerSummary,
    scanDuration,
    isScanning,
  } = useBiometrics()

  const [step, setStep] = useState<'intake' | 'biometric'>('intake')
  const [isInitializing, setIsInitializing] = useState(false)
  const sessionCreatedRef = useRef(false)
  const stoppingRef = useRef(false)
  const [scanError, setScanError] = useState<string | null>(null)

  // MediaRecorder pipeline refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  // Start MediaRecorder when scanning begins
  useEffect(() => {
    if (isScanning && cameraStream) {
      // Determine best supported mimeType
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm'

      recordedChunksRef.current = []
      const recorder = new MediaRecorder(cameraStream, {
        mimeType,
        videoBitsPerSecond: 2_500_000, // 2.5 Mbps for good quality
      })

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      recorder.start(1000) // collect chunks every second
      mediaRecorderRef.current = recorder
      console.log(`[MediaRecorder] Recording started (${mimeType}, 720p, 30fps)`)

      return () => {
        if (recorder.state !== 'inactive') {
          recorder.stop()
        }
      }
    }
  }, [isScanning, cameraStream])

  // Drive scan-phase transitions for VoicePlayer guidance
  useEffect(() => {
    if (isScanning) {
      if (scanDuration >= SCAN_DURATION_SECONDS * 0.75) {
        setScanPhase('completing')
      } else if (scanDuration >= SCAN_DURATION_SECONDS * 0.5) {
        setScanPhase('midway')
      } else if (scanDuration > 2) {
        setScanPhase('scanning')
      }
    }
  }, [isScanning, scanDuration, setScanPhase])

  // Handle scan completion — stop recording and upload video
  useEffect(() => {
    const completeScan = async () => {
      if (isScanning && scanDuration >= SCAN_DURATION_SECONDS && !stoppingRef.current) {
        stoppingRef.current = true

        // Stop the MediaRecorder and wait for final chunks
        const recorder = mediaRecorderRef.current
        if (recorder && recorder.state !== 'inactive') {
          await new Promise<void>((resolve) => {
            recorder.onstop = () => resolve()
            recorder.stop()
          })
        }
        mediaRecorderRef.current = null

        // Build and upload the WebM blob
        const chunks = recordedChunksRef.current
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: 'video/webm' })
          recordedChunksRef.current = []
          console.log(`[MediaRecorder] Recording complete: ${(blob.size / 1024 / 1024).toFixed(1)}MB`)

          if (blob.size < MIN_VIDEO_BYTES) {
            console.warn(`[MediaRecorder] Video too small (${(blob.size / 1024 / 1024).toFixed(2)}MB). Gating scan.`)
            setScanError(`Scan quality too low. Please ensure good lighting, stay still, and record for the full ${SCAN_DURATION_SECONDS}s.`)
            setScanPhase('welcome')
            stopScan()
            stoppingRef.current = false
            return
          }

          try {
            const formData = new FormData()
            formData.append('video', blob, 'scan.webm')

            setScanPhase('analyzing') // show "processing" UI while uploading
            console.log('[biometrics] Uploading video to server...')
            const response = await fetch('/api/biometrics/process-video', {
              method: 'POST',
              body: formData,
            })

            if (response.ok) {
              const summary = await response.json()
              console.log('[biometrics] Server summary from Presage SDK:', summary)
              setServerSummary(summary)
            } else {
              const errText = await response.text()
              console.error('[biometrics] process-video failed:', response.status, errText)
            }
          } catch (err) {
            console.error('Failed to upload video:', err)
          }
        } else {
          console.warn('[MediaRecorder] No chunks recorded')
          setScanError('No video captured. Please try again and keep your face within the guide.')
          setScanPhase('welcome')
          stopScan()
          stoppingRef.current = false
          return
        }

        stopScan()
        setScanPhase('complete')
      }
    }

    completeScan()
  }, [isScanning, scanDuration, stopScan, setScanPhase, setServerSummary])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      stopScan()
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [stopCamera, stopScan])

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  const handleTabChange = (tab: string) => {
    if (tab === 'history') {
      navigate('/history')
    } else if (tab === 'analyze') {
      navigate('/report')
    } else if (tab === 'period') {
      navigate('/period-tracker')
    } else if (tab === 'wellness') {
      navigate('/wellness')
    }
  }

  const handleContinueToScan = async () => {
    setIsInitializing(true)
    try {
      await initializeCamera()
      setStep('biometric')
      setScanPhase('welcome')
    } catch (err) {
      console.error('Failed to initialize camera:', err)
    } finally {
      setIsInitializing(false)
    }
  }

  const handleStartRecording = useCallback(async () => {
    // Create Supabase session if not already created
    if (!sessionCreatedRef.current) {
      sessionCreatedRef.current = true
      await createSession()
    }

    stoppingRef.current = false
    setScanError(null)
    startScan()
    setScanPhase('scanning')
  }, [startScan, setScanPhase, createSession])

  const handleAnalyze = useCallback(async () => {
    console.log('=== Starting Analysis ===')
    setProcessingDiagnosis(true)
    setScanPhase('analyzing')

    try {
      // Use the server's Presage SDK summary (stored in BiometricContext via setServerSummary)
      const biometricSummary = getSummary()
      console.log('Biometric summary (from server):', biometricSummary)
      console.log('Intake data:', { lifeStage, selectedBodyParts, symptoms, currentMedications })

      const response = await fetch('/api/diagnosis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intake: { lifeStage, selectedBodyParts, symptoms, currentMedications },
          biometrics: biometricSummary,
        }),
      })

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('API result:', result)

      if (result && result.urgencyLevel) {
        console.log('Valid result, saving and navigating...')
        await saveSessionData(biometricSummary, result)
        setDiagnosisResult(result)
        console.log('Navigating to /report')
        navigate('/report')
      } else if (!response.ok) {
        throw new Error(`Failed to analyze: ${response.status}`)
      } else {
        console.log('Result without urgencyLevel, navigating anyway...')
        setDiagnosisResult(result)
        navigate('/report')
      }
    } catch (err) {
      console.error('Diagnosis error:', err)
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to analyze'}`)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-healing-50">
        <div className="text-center animate-pulse-slow">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-neutral-600">Initializing camera...</p>
        </div>
      </div>
    )
  }

  if (cameraError && step === 'biometric') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-healing-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-red-600 mb-2">Camera Error</h2>
          <p className="text-neutral-600 mb-6">{cameraError}</p>
          <button
            onClick={() => setStep('intake')}
            className="px-6 py-3 bg-healing-700 text-white rounded-lg font-medium hover:bg-healing-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-healing-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in">
          {/* Navigation */}
          <Navigation
            activeTab="new"
            onTabChange={handleTabChange}
            onLogout={handleSignOut}
          />

          {/* Step indicator */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-4">
              <div className={`flex items-center gap-2 ${step === 'intake' ? 'text-healing-700' : 'text-neutral-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step === 'intake' ? 'bg-healing-700 text-white' : 'bg-neutral-200 text-neutral-500'
                  }`}>
                  1
                </div>
                <span className="font-medium hidden sm:inline">Assessment</span>
              </div>
              <div className="w-12 h-0.5 bg-neutral-200" />
              <div className={`flex items-center gap-2 ${step === 'biometric' ? 'text-healing-700' : 'text-neutral-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step === 'biometric' ? 'bg-healing-700 text-white' : 'bg-neutral-200 text-neutral-500'
                  }`}>
                  2
                </div>
                <span className="font-medium hidden sm:inline">Biometric Scan</span>
              </div>
            </div>
          </div>

          {/* Content area */}
          <main className="px-6 pb-8">
            {step === 'intake' ? (
              <IntakeStep
                onContinue={handleContinueToScan}
                canProceed={canProceedToScan}
                lifeStage={lifeStage}
                selectedBodyParts={selectedBodyParts}
              />
            ) : (
              <>
                <VoicePlayer />
                <CameraViewSection
                  isScanning={isScanning}
                  scanDuration={scanDuration}
                  scanPhase={scanPhase}
                  currentBpm={0}
                  currentHrv={0}
                  currentConfidence={0}
                  onStartRecording={handleStartRecording}
                  onAnalyze={handleAnalyze}
                  processingDiagnosis={processingDiagnosis}
                  scanError={scanError}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}