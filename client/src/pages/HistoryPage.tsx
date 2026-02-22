import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sessionsApi } from '../services/supabaseApi'
import LoadingSpinner from '../components/common/LoadingSpinner'

interface SessionData {
  id: string
  created_at: string
  life_stage: string
  selected_body_parts: string[]
  symptoms: Array<{
    id: string
    body_part: string
    description: string
    severity: number
  }>
  diagnosis_results: Array<{
    urgency_level: string
    primary_assessment: string
  }>
  biometric_summaries: Array<{
    avg_bpm: number
    avg_hrv: number
  }>
}

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

// Session Card component
function SessionCard({
  session,
  index,
  onClick
}: {
  session: SessionData
  index: number
  onClick: () => void
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }) + ', ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).toUpperCase()
  }

  const formatLifeStage = (stage: string) => {
    return stage
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const primaryBodyPart = session.selected_body_parts[0] || 'N/A'
  const symptomCount = session.symptoms?.length || 0

  return (
    <div
      className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center
                 transform transition-all duration-500 hover:scale-105 hover:shadow-xl
                 animate-fade-in-up border border-neutral-100"
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: 'both'
      }}
    >
      {/* Date pill */}
      <div className="inline-block px-4 py-2 border-2 border-healing-800 rounded-full mb-5">
        <span className="text-healing-800 font-medium text-sm">
          {formatDate(session.created_at)}
        </span>
      </div>

      {/* Life Stage */}
      <div className="mb-4">
        <h3 className="text-healing-800 font-bold text-sm tracking-wide uppercase">
          Life Stage
        </h3>
        <p className="text-neutral-700 mt-1">
          {formatLifeStage(session.life_stage)}
        </p>
      </div>

      {/* Area of Concern */}
      <div className="mb-4">
        <h3 className="text-healing-800 font-bold text-sm tracking-wide uppercase">
          Area of Concern
        </h3>
        <p className="text-neutral-700 mt-1">
          {primaryBodyPart.charAt(0).toUpperCase() + primaryBodyPart.slice(1)}
        </p>
      </div>

      {/* Symptoms */}
      <div className="mb-6">
        <h3 className="text-healing-800 font-bold text-sm tracking-wide uppercase">
          Symptoms
        </h3>
        <p className="text-neutral-700 mt-1 text-lg font-semibold">
          {symptomCount}
        </p>
      </div>

      {/* CTA Button */}
      <button
        onClick={onClick}
        className="w-full bg-healing-700 hover:bg-healing-800 text-white font-medium py-3 px-6 rounded-lg
                   transition-all duration-300 hover:shadow-lg hover:shadow-healing-700/30
                   active:scale-95"
      >
        Click to see full report
      </button>
    </div>
  )
}

// AI Summary component
function AISummary({ sessions }: { sessions: SessionData[] }) {
  const generateSummary = () => {
    if (sessions.length === 0) {
      return "No scan history yet. Complete your first scan to see AI-powered insights about your health patterns."
    }

    const totalScans = sessions.length
    const totalSymptoms = sessions.reduce((acc, s) => acc + (s.symptoms?.length || 0), 0)
    const bodyParts = [...new Set(sessions.flatMap(s => s.selected_body_parts))]

    const urgentCount = sessions.filter(s =>
      s.diagnosis_results?.[0]?.urgency_level === 'URGENT' ||
      s.diagnosis_results?.[0]?.urgency_level === 'EMERGENCY'
    ).length

    let summary = `You have completed ${totalScans} scan${totalScans > 1 ? 's' : ''} with ${totalSymptoms} total symptom${totalSymptoms !== 1 ? 's' : ''} recorded. `

    if (bodyParts.length > 0) {
      summary += `Primary areas of concern include: ${bodyParts.slice(0, 3).join(', ')}. `
    }

    if (urgentCount > 0) {
      summary += `${urgentCount} scan${urgentCount > 1 ? 's' : ''} flagged as requiring attention. `
    }

    summary += "Remember to follow up with a healthcare provider for any persistent symptoms."

    return summary
  }

  return (
    <div className="mb-8 animate-fade-in">
      {/* AI Summary pill */}
      <div className="flex justify-center mb-4">
        <div className="inline-block px-6 py-2 border-2 border-healing-800 rounded-full">
          <span className="text-healing-800 font-semibold">AI Summary</span>
        </div>
      </div>

      {/* Summary box */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-neutral-100">
        <p className="text-neutral-700 leading-relaxed">
          {generateSummary()}
        </p>
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('history')

  const { signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const sessionsData = await sessionsApi.getAll()
      setSessions(sessionsData || [])
    } catch (err) {
      console.error('Failed to load history:', err)
      setError('Failed to load session history')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'new') {
      navigate('/dashboard')
    } else if (tab === 'analyze') {
      navigate('/report')
    } else if (tab === 'period') {
      navigate('/period-tracker')
    } else if (tab === 'wellness') {
      navigate('/wellness')
    }
  }

  const handleViewReport = (sessionId: string) => {
    // Navigate to the validation report page with the session ID
    navigate(`/report?session=${sessionId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-healing-50">
        <div className="animate-pulse-slow">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-healing-50">
      {/* Main container with rounded corners and shadow */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in">
          {/* Navigation */}
          <Navigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onLogout={handleSignOut}
          />

          {/* Content area */}
          <main className="px-6 pb-8 pt-4">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 animate-shake">
                {error}
              </div>
            )}

            {/* AI Summary */}
            <AISummary sessions={sessions} />

            {/* Session cards grid */}
            {sessions.length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-24 h-24 mx-auto mb-6 bg-healing-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-healing-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-neutral-500 text-lg mb-4">No scans yet</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 bg-healing-700 text-white font-medium rounded-lg
                           hover:bg-healing-800 transition-all duration-300 hover:shadow-lg
                           hover:shadow-healing-700/30 active:scale-95"
                >
                  Start Your First Scan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session, index) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    index={index}
                    onClick={() => handleViewReport(session.id)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
