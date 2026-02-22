import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useBiometrics } from '../context/BiometricContext'
import { useAuth } from '../context/AuthContext'
import { sessionsApi } from '../services/supabaseApi'
import { clinicsApi } from '../services/api'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ClinicMap from '../components/report/ClinicMap'
import type { Clinic } from '../types'

// Logo component
function Logo() {
  return (
    <div className="w-11 h-11 bg-brand-dark rounded-2xl flex items-center justify-center">
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none">
        <path
          d="M8 8V24M8 16H16M16 8V24"
          stroke="#74AC82"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24 12V20M20 16H28"
          stroke="#74AC82"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

// Sidebar Navigation
function Sidebar({ onNavigate }: { onNavigate: (path: string) => void }) {
  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', path: '/report', active: true },
    { icon: 'scan', label: 'New Scan', path: '/dashboard' },
    { icon: 'history', label: 'History', path: '/history' },
    { icon: 'period', label: 'Period Tracker', path: '/period-tracker' },
    { icon: 'wellness', label: 'Wellness', path: '/wellness' },
  ]

  const renderIcon = (icon: string, active: boolean) => {
    const color = active ? '#fff' : '#164A31'
    switch (icon) {
      case 'dashboard':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}>
            <path d="M4 13h6a1 1 0 001-1V4a1 1 0 00-1-1H4a1 1 0 00-1 1v8a1 1 0 001 1zm0 8h6a1 1 0 001-1v-4a1 1 0 00-1-1H4a1 1 0 00-1 1v4a1 1 0 001 1zm10 0h6a1 1 0 001-1v-8a1 1 0 00-1-1h-6a1 1 0 00-1 1v8a1 1 0 001 1zm0-18v4a1 1 0 001 1h6a1 1 0 001-1V4a1 1 0 00-1-1h-6a1 1 0 00-1 1z" />
          </svg>
        )
      case 'scan':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        )
      case 'history':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'period':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        )
      case 'wellness':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-20 bg-white border-r border-neutral-100 flex flex-col items-center py-6 z-50">
      <Logo />
      <nav className="mt-8 flex flex-col gap-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${item.active
              ? 'bg-brand-dark shadow-lg'
              : 'hover:bg-brand-50'
              }`}
            title={item.label}
          >
            {renderIcon(item.icon, !!item.active)}
          </button>
        ))}
      </nav>
    </aside>
  )
}

// Stats Card Component
function StatsCard({
  label,
  value,
  unit,
  icon,
  trend
}: {
  label: string
  value: string | number
  unit?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-neutral-500">{label}</span>
        {icon && <div className="text-brand-light">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-semibold text-neutral-800">{value}</span>
        {unit && <span className="text-lg text-neutral-400">{unit}</span>}
      </div>
      {trend && (
        <div className={`mt-2 text-xs ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-neutral-400'}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} Normal range
        </div>
      )}
    </div>
  )
}

// Urgency Badge Component
function UrgencyBadge({ level }: { level: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    EMERGENCY: { bg: 'bg-red-100', text: 'text-red-700', label: 'Emergency' },
    URGENT: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Urgent' },
    MODERATE: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Moderate' },
    LOW: { bg: 'bg-brand-100', text: 'text-brand-dark', label: 'Low Priority' },
  }
  const style = styles[level] || styles.MODERATE

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}

export default function ValidationReportPage() {
  console.log('Rendering ValidationReportPage')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')

  console.log('ValidationReportPage params:', { sessionId })

  const { signOut } = useAuth()
  const {
    diagnosisResult: currentDiagnosisResult,
    lifeStage: currentLifeStage,
    selectedBodyParts: currentSelectedBodyParts,
    symptoms: currentSymptoms,
    currentMedications,
    resetSession,
  } = useApp()
  const { getSummary, resetBiometrics } = useBiometrics()

  // State for historical session data
  const [historicalSession, setHistoricalSession] = useState<{
    lifeStage: string | null
    selectedBodyParts: string[]
    symptoms: Array<{ bodyPart: string; description: string; severity: number }>
    diagnosisResult: {
      urgencyLevel: string
      urgencyReason: string
      primaryAssessment: string
      recommendations: string[]
      redFlags: string[]
      differentialConsiderations: string[]
      specialtyReferral?: string
      questionsForDoctor?: string[]
      disclaimer: string
    } | null
    biometricSummary: {
      avgBpm: number
      avgHrv: number
      minBpm: number
      maxBpm: number
      scanDuration: number
      totalReadings: number
      validReadings: number
    } | null
    currentMedications: string[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allSessions, setAllSessions] = useState<any[]>([])

  // Helper: Supabase may return joined data as an array OR a single object
  // depending on UNIQUE constraints. This safely extracts the first/only item.
  const firstOrSelf = (val: any) => {
    if (!val) return null
    if (Array.isArray(val)) return val[0] || null
    return val // it's already a single object
  }

  // Load historical session if sessionId is in URL
  useEffect(() => {
    if (sessionId) {
      console.log('[Report] Loading session by ID:', sessionId)
      setLoading(true)
      setError(null)
      sessionsApi.getById(sessionId)
        .then((data) => {
          console.log('[Report] getById returned:', JSON.stringify(data, null, 2))
          const diagnosis = firstOrSelf(data.diagnosis_results)
          const biometrics = firstOrSelf(data.biometric_summaries)
          const symptomsList = Array.isArray(data.symptoms) ? data.symptoms : (data.symptoms ? [data.symptoms] : [])
          console.log('[Report] Session diagnosis:', diagnosis?.urgency_level, 'biometrics:', biometrics?.avg_bpm)

          // Always set historical session with whatever data we have
          setHistoricalSession({
            lifeStage: data.life_stage,
            selectedBodyParts: data.selected_body_parts || [],
            symptoms: symptomsList.map((s: any) => ({
              bodyPart: s.body_part,
              description: s.description,
              severity: s.severity,
            })),
            diagnosisResult: diagnosis ? {
              urgencyLevel: diagnosis.urgency_level,
              urgencyReason: diagnosis.urgency_reason || '',
              primaryAssessment: diagnosis.primary_assessment,
              recommendations: diagnosis.recommendations || [],
              redFlags: diagnosis.red_flags || [],
              differentialConsiderations: diagnosis.differential_considerations || [],
              specialtyReferral: diagnosis.specialty_referral,
              questionsForDoctor: diagnosis.questions_for_doctor || [],
              disclaimer: diagnosis.disclaimer || 'This is not medical advice.',
            } : {
              urgencyLevel: 'MODERATE',
              urgencyReason: 'No AI analysis was performed for this session.',
              primaryAssessment: 'This session has symptom and biometric data but no AI diagnosis was generated. Click "Analyze with AI" above to generate a fresh analysis.',
              recommendations: ['Click "Analyze with AI" to get an AI-powered assessment of your symptoms and biometrics.'],
              redFlags: [],
              differentialConsiderations: [],
              disclaimer: 'This is a preliminary triage assessment, not a medical diagnosis. Always consult with a qualified healthcare provider.',
            },
            biometricSummary: biometrics ? {
              avgBpm: biometrics.avg_bpm,
              avgHrv: biometrics.avg_hrv,
              minBpm: biometrics.min_bpm,
              maxBpm: biometrics.max_bpm,
              scanDuration: biometrics.scan_duration || 0,
              totalReadings: 0,
              validReadings: 0,
            } : null,
            currentMedications: data.current_medications || [],
          })
        })
        .catch((err) => {
          console.error('[Report] Failed to load session:', err)
          setError(`Failed to load session: ${err?.message || 'Unknown error'}`)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [sessionId])

  // Auto-load the most recent session when no session ID and no current result
  useEffect(() => {
    if (!sessionId && !currentDiagnosisResult) {
      console.log('[Report] Auto-loading latest session (no sessionId, no current diagnosis)')
      setLoading(true)
      setError(null)
      sessionsApi.getAll()
        .then((sessions) => {
          console.log('[Report] sessionsApi.getAll() returned:', sessions?.length, 'sessions')

          if (!sessions || sessions.length === 0) {
            console.log('[Report] No sessions found at all')
            setError('No previous sessions found. Complete an assessment first.')
            return
          }

          // Store all sessions for the session picker
          setAllSessions(sessions)

          // Find the most recent session that has a diagnosis
          // Handle both array and object formats for diagnosis_results
          const latest = sessions.find((s: any) => {
            const d = firstOrSelf(s.diagnosis_results)
            return !!d
          })
          console.log('[Report] Latest session with diagnosis:', latest?.id || 'NONE FOUND')

          if (latest) {
            const diagnosis = firstOrSelf(latest.diagnosis_results)
            const biometrics = firstOrSelf(latest.biometric_summaries)
            const symptomsList = Array.isArray(latest.symptoms) ? latest.symptoms : (latest.symptoms ? [latest.symptoms] : [])
            console.log('[Report] Loading diagnosis:', diagnosis?.urgency_level, diagnosis?.primary_assessment?.substring(0, 50))

            setHistoricalSession({
              lifeStage: latest.life_stage,
              selectedBodyParts: latest.selected_body_parts || [],
              symptoms: symptomsList.map((s: any) => ({
                bodyPart: s.body_part,
                description: s.description,
                severity: s.severity,
              })),
              diagnosisResult: {
                urgencyLevel: diagnosis.urgency_level,
                urgencyReason: diagnosis.urgency_reason || '',
                primaryAssessment: diagnosis.primary_assessment,
                recommendations: diagnosis.recommendations || [],
                redFlags: diagnosis.red_flags || [],
                differentialConsiderations: diagnosis.differential_considerations || [],
                specialtyReferral: diagnosis.specialty_referral,
                questionsForDoctor: diagnosis.questions_for_doctor || [],
                disclaimer: diagnosis.disclaimer || 'This is not medical advice.',
              },
              biometricSummary: biometrics ? {
                avgBpm: biometrics.avg_bpm,
                avgHrv: biometrics.avg_hrv,
                minBpm: biometrics.min_bpm,
                maxBpm: biometrics.max_bpm,
                scanDuration: biometrics.scan_duration || 0,
                totalReadings: 0,
                validReadings: 0,
              } : null,
              currentMedications: latest.current_medications || [],
            })
          } else {
            // Sessions exist but none have diagnosis results
            console.log('[Report] Sessions exist but none have diagnosis_results')
            setError('Your previous sessions do not have diagnosis results yet. Complete a full assessment to generate a report.')
          }
        })
        .catch((err) => {
          console.error('[Report] Failed to load latest session:', err)
          setError(`Failed to load session data: ${err?.message || 'Unknown error'}. Please check your connection and try again.`)
        })
        .finally(() => {
          setLoading(false)
        })
    } else if (!sessionId && currentDiagnosisResult) {
      // We have current context data, no need to load
      console.log('[Report] Using current context diagnosis result')
      setLoading(false)
    } else if (sessionId) {
      // First useEffect handles this case - but if it hasn't set loading to false yet, that's ok
      console.log('[Report] Session ID provided, first useEffect will handle loading')
    }
  }, [sessionId])

  // Use historical data if available, otherwise use current context
  const diagnosisResult = historicalSession?.diagnosisResult || currentDiagnosisResult
  const lifeStage = historicalSession?.lifeStage || currentLifeStage
  const selectedBodyParts = historicalSession?.selectedBodyParts || currentSelectedBodyParts
  const symptoms = historicalSession?.symptoms || currentSymptoms
  const currentMedicationsList = historicalSession?.currentMedications || currentMedications
  const biometricSummary = historicalSession?.biometricSummary || getSummary()

  // Nearby clinics state
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  const [clinicsLoading, setClinicsLoading] = useState(false)
  const [clinicsError, setClinicsError] = useState<string | null>(null)

  // Fetch nearby clinics via geolocation
  useEffect(() => {
    if (diagnosisResult && navigator.geolocation) {
      setClinicsLoading(true)
      setClinicsError(null)
      console.log('[Report] Requesting geolocation...')
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          console.log('[Report] Got location:', loc.lat, loc.lng)
          setUserLocation(loc)
          try {
            console.log('[Report] Fetching nearby clinics...')
            const data = await clinicsApi.findNearby(loc.lat, loc.lng)
            console.log('[Report] Clinics API returned:', data.clinics?.length, 'clinics')
            setClinics(data.clinics || [])
          } catch (err: any) {
            console.error('[Report] Failed to fetch clinics:', err)
            setClinicsError('Could not load nearby clinics. Please try again later.')
          } finally {
            setClinicsLoading(false)
          }
        },
        (err) => {
          console.warn('[Report] Geolocation denied:', err.message)
          setClinicsError('Location access denied. Please enable location permissions in your browser to find nearby clinics.')
          setClinicsLoading(false)
        },
        { timeout: 15000, enableHighAccuracy: false }
      )
    }
  }, [diagnosisResult])

  const handleStartNew = () => {
    resetSession()
    resetBiometrics()
    navigate('/dashboard')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }


  const handleNavigate = (path: string) => {
    if (path === '/') {
      handleStartNew()
    } else {
      navigate(path)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-neutral-600">Loading report...</p>
        </div>
      </div>
    )
  }

  if (!diagnosisResult) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="print:hidden">
          <Sidebar onNavigate={handleNavigate} />
        </div>
        <main className="ml-20">
          <header className="bg-white border-b border-neutral-100 px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Health Report</p>
                <h1 className="text-2xl font-semibold text-neutral-800">Analyze Reports</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-dark text-white rounded-xl text-sm font-medium hover:bg-brand-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </header>

          <div className="p-8">
            {error && (
              <div className="bg-warmth-50 border border-warmth-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
                <svg className="w-5 h-5 text-warmth-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-warmth-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="ml-auto text-sm text-brand-dark hover:text-brand-800 underline"
                >
                  Retry
                </button>
              </div>
            )}

            {allSessions.length > 0 ? (
              <>
                <p className="text-neutral-500 mb-6">Select a session below to view its full report and analysis.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allSessions.map((session: any) => {
                    const diagnosis = firstOrSelf(session.diagnosis_results)
                    const biometrics = firstOrSelf(session.biometric_summaries)
                    const date = new Date(session.created_at)
                    const hasReport = !!diagnosis

                    return (
                      <button
                        key={session.id}
                        onClick={() => navigate(`/report?session=${session.id}`)}
                        className={`bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all text-left border-2 ${hasReport ? 'border-transparent hover:border-brand-light' : 'border-transparent hover:border-neutral-200'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-neutral-400">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {' '}
                            {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          {hasReport ? (
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${diagnosis.urgency_level === 'EMERGENCY' ? 'bg-red-100 text-red-700' :
                              diagnosis.urgency_level === 'URGENT' ? 'bg-orange-100 text-orange-700' :
                                diagnosis.urgency_level === 'MODERATE' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                              }`}>
                              {diagnosis.urgency_level}
                            </span>
                          ) : (
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-neutral-100 text-neutral-500">
                              No Diagnosis
                            </span>
                          )}
                        </div>

                        <h3 className="font-medium text-neutral-800 capitalize mb-1">
                          {session.life_stage?.replace(/_/g, ' ') || 'Unknown'}
                        </h3>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {(session.selected_body_parts || []).slice(0, 3).map((part: string) => (
                            <span key={part} className="px-2 py-0.5 bg-brand-50 text-brand-dark rounded text-xs capitalize">
                              {part}
                            </span>
                          ))}
                        </div>

                        {hasReport && (
                          <p className="text-xs text-neutral-500 line-clamp-2">
                            {diagnosis.primary_assessment?.substring(0, 120)}...
                          </p>
                        )}

                        {biometrics && (
                          <div className="mt-3 flex gap-4 text-xs text-neutral-400">
                            <span>❤️ {biometrics.avg_bpm} bpm</span>
                            <span>📊 HRV {biometrics.avg_hrv} ms</span>
                          </div>
                        )}

                        <div className="mt-4 text-sm font-medium text-brand-dark flex items-center gap-1">
                          View Full Report
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-brand-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-brand-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-neutral-800 mb-2">No Reports Yet</h2>
                <p className="text-neutral-500 mb-6">Complete an assessment to view your health report.</p>
                <Button variant="primary" onClick={() => navigate('/dashboard')}>
                  Start Assessment
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  const formatLifeStage = (stage: string | null) => {
    if (!stage) return 'Not specified'
    return stage.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  return (
    <div className="min-h-screen bg-neutral-50 print:bg-white">
      {/* Sidebar */}
      <div className="print:hidden">
        <Sidebar onNavigate={handleNavigate} />
      </div>

      {/* Main Content */}
      <main className="ml-20 print:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-neutral-100 px-8 py-4 print:border-b-2 print:border-black">
          <div className="flex items-center justify-between">
            <div>
              {sessionId && (
                <button
                  onClick={() => navigate('/history')}
                  className="flex items-center gap-1 text-sm text-brand-dark hover:text-brand-800 mb-1 print:hidden"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to History
                </button>
              )}
              <p className="text-sm text-neutral-400">Health Report {sessionId ? '(Historical)' : ''}</p>
              <h1 className="text-2xl font-semibold text-neutral-800">Health Status Overview</h1>
            </div>
            <div className="flex items-center gap-3 print:hidden">
              <button
                onClick={handlePrint}
                className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                title="Print Report"
              >
                <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-brand-dark text-white rounded-xl text-sm font-medium hover:bg-brand-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {/* Disclaimer - At Top */}
          <div className="bg-warmth-50 border border-warmth-200 rounded-3xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-warmth-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium text-warmth-800 mb-1">Important Disclaimer</p>
                <p className="text-sm text-warmth-700">{diagnosisResult.disclaimer}</p>
              </div>
            </div>
          </div>


          {/* Top Row - Stats and Assessment */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Biometric Stats */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl p-6 shadow-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-neutral-800">Biometric Readings</h2>
                  <span className="text-xs text-neutral-400">
                    {biometricSummary ? `${biometricSummary.scanDuration}s scan` : 'No data'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatsCard
                    label="Average BPM"
                    value={biometricSummary?.avgBpm || '--'}
                    unit="bpm"
                    icon={
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    }
                    trend="neutral"
                  />
                  <StatsCard
                    label="Max BPM"
                    value={biometricSummary?.maxBpm ? Number(biometricSummary.maxBpm).toFixed(2) : '--'}
                    unit="bpm"
                  />
                  <StatsCard
                    label="Min BPM"
                    value={biometricSummary?.minBpm ? Number(biometricSummary.minBpm).toFixed(2) : '--'}
                    unit="bpm"
                  />
                  <StatsCard
                    label="HRV"
                    value={biometricSummary?.avgHrv || '--'}
                    unit="ms"
                    icon={
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                      </svg>
                    }
                  />
                </div>

                {/* Heart Rate Visual */}
                {biometricSummary && (
                  <div className="mt-6 pt-6 border-t border-neutral-100">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-500 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="h-12 bg-neutral-50 rounded-xl overflow-hidden flex items-center px-4">
                          {/* Simple ECG-like visualization */}
                          <svg viewBox="0 0 200 40" className="w-full h-8 text-brand-light">
                            <path
                              d="M0,20 L20,20 L25,20 L30,10 L35,30 L40,5 L45,35 L50,20 L55,20 L75,20 L80,20 L85,10 L90,30 L95,5 L100,35 L105,20 L110,20 L130,20 L135,20 L140,10 L145,30 L150,5 L155,35 L160,20 L165,20 L200,20"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                          </svg>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">
                          Confidence: {biometricSummary.validReadings}/{biometricSummary.totalReadings} valid readings
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Patient Info */}
            <div className="bg-white rounded-3xl p-6 shadow-card">
              <h2 className="text-lg font-semibold text-neutral-800 mb-4">Patient Info</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-neutral-400 uppercase tracking-wide">Life Stage</p>
                  <p className="text-sm font-medium text-neutral-800 mt-1">{formatLifeStage(lifeStage)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 uppercase tracking-wide">Areas of Concern</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedBodyParts.map((part) => (
                      <span key={part} className="px-2 py-1 bg-brand-50 text-brand-dark rounded-lg text-xs capitalize">
                        {part}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 uppercase tracking-wide">Symptoms</p>
                  <p className="text-sm font-medium text-neutral-800 mt-1">{symptoms.length} reported</p>
                </div>
                {currentMedicationsList.length > 0 && (
                  <div>
                    <p className="text-xs text-neutral-400 uppercase tracking-wide">Medications</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentMedicationsList.map((med) => (
                        <span key={med} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs">
                          {med}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-neutral-400 uppercase tracking-wide">Date</p>
                  <p className="text-sm font-medium text-neutral-800 mt-1">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Main Assessment */}
            <div className="lg:col-span-2 bg-gradient-to-br from-brand-dark to-brand-900 rounded-3xl p-6 text-white shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">AI Analytics</h2>
                    <p className="text-sm text-white/60">Powered by Gemini</p>
                  </div>
                </div>
                <UrgencyBadge level={diagnosisResult.urgencyLevel} />
              </div>

              <div className="mt-6">
                <h3 className="text-sm text-white/60 uppercase tracking-wide mb-2">Assessment</h3>
                <p className="text-white/90 leading-relaxed">{diagnosisResult.primaryAssessment}</p>
              </div>

              <div className="mt-6">
                <h3 className="text-sm text-white/60 uppercase tracking-wide mb-2">Why This Urgency?</h3>
                <p className="text-white/90">{diagnosisResult.urgencyReason}</p>
              </div>
            </div>

            {/* Red Flags */}
            <div className="bg-white rounded-3xl p-6 shadow-card">
              <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Warning Signs
              </h2>
              {diagnosisResult.redFlags.length > 0 ? (
                <ul className="space-y-2">
                  {diagnosisResult.redFlags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-neutral-700">{flag}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-neutral-500">No immediate warning signs detected.</p>
              )}
            </div>
          </div>

          {/* Recommendations and Questions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Recommendations */}
            <div className="bg-white rounded-3xl p-6 shadow-card">
              <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recommendations
              </h2>
              <ul className="space-y-3">
                {diagnosisResult.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-brand-50 text-brand-dark rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-neutral-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Questions for Doctor */}
            <div className="bg-white rounded-3xl p-6 shadow-card">
              <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Questions for Your Doctor
              </h2>
              {diagnosisResult.questionsForDoctor && diagnosisResult.questionsForDoctor.length > 0 ? (
                <ul className="space-y-3">
                  {diagnosisResult.questionsForDoctor.map((q, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0">
                        ?
                      </span>
                      <span className="text-sm text-neutral-700">{q}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-neutral-500">No specific questions generated. Discuss your symptoms with your healthcare provider.</p>
              )}
            </div>
          </div>

          {/* Possible Conditions & Specialist */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Differential Considerations */}
            {diagnosisResult.differentialConsiderations.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-card">
                <h2 className="text-lg font-semibold text-neutral-800 mb-4">Possible Considerations</h2>
                <div className="flex flex-wrap gap-2">
                  {diagnosisResult.differentialConsiderations.map((condition, i) => (
                    <span
                      key={i}
                      className="px-3 py-2 bg-neutral-100 text-neutral-700 rounded-xl text-sm"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Specialty Referral */}
            {diagnosisResult.specialtyReferral && (
              <div className="bg-brand-50 rounded-3xl p-6 border border-brand-100">
                <h2 className="text-lg font-semibold text-brand-dark mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Suggested Specialist
                </h2>
                <p className="text-brand-800">{diagnosisResult.specialtyReferral}</p>
              </div>
            )}
          </div>

          {/* Biometric Proof Section */}
          {/* {biometricSummary && (
            <div className="mb-6">
              <BiometricProof summary={biometricSummary} />
            </div>
          )} */}

          {/* Nearby Clinics Section */}
          <div className="bg-white rounded-3xl p-6 shadow-card mb-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-healing-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Find Care Nearby
            </h2>
            {clinicsLoading ? (
              <div className="flex items-center gap-3 py-8 justify-center">
                <LoadingSpinner size="sm" />
                <p className="text-neutral-500">Finding nearby clinics...</p>
              </div>
            ) : clinicsError ? (
              <div className="bg-warmth-50 border border-warmth-200 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-warmth-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-warmth-700">{clinicsError}</p>
                </div>
              </div>
            ) : (
              <ClinicMap clinics={clinics} userLocation={userLocation} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
