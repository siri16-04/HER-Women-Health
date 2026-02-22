import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { periodApi } from '../services/supabaseApi'
import { cycleApi } from '../services/cycleApi'
import LoadingSpinner from '../components/common/LoadingSpinner'

// New components
import { CycleInsights } from '../components/period/CycleInsights'
import { DueDateCalculator } from '../components/period/DueDateCalculator'
import { MenstrualCalendar } from '../components/period/MenstrualCalendar'
import { PCOSClassifier } from '../components/period/PCOSClassifier'
import { PeriodHistory } from '../components/period/PeriodHistory'
import { PeriodLogger } from '../components/period/PeriodLogger'
import type { PeriodEntry } from '../utils/healthcare'

// Types
interface PeriodLog {
    id: string
    period_start: string
    period_end: string | null
    cycle_length: number | null
    notes: string | null
    flow_intensity: 'Light' | 'Medium' | 'Heavy' | 'Spotting' | null
    symptoms: string[] | null
    created_at: string
}



// Logo
function Logo() {
    return <img src="/logo.png" alt="HER" className="w-12 h-12 object-contain" />
}

// Sidebar Navigation
function Sidebar({ onNavigate }: { onNavigate: (path: string) => void }) {
    const navItems = [
        { icon: 'dashboard', label: 'Dashboard', path: '/report' },
        { icon: 'scan', label: 'New Scan', path: '/dashboard' },
        { icon: 'history', label: 'History', path: '/history' },
        { icon: 'period', label: 'Period Tracker', path: '/period-tracker', active: true },
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
                        <path d="M12 14l-1.5 2.5L12 19l1.5-2.5z" fill={color} stroke="none" />
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

// Helper functions


function formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
}

function parseDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
}



export default function PeriodTrackerPage() {
    const navigate = useNavigate()
    const { signOut } = useAuth()

    // State
    const [logs, setLogs] = useState<PeriodLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [cycleInsights, setCycleInsights] = useState<any>(null)
    const [loadingInsights, setLoadingInsights] = useState(false)

    // New component states
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [editingEntry, setEditingEntry] = useState<PeriodEntry | null>(null)
    const [isLoggerOpen, setIsLoggerOpen] = useState(false)

    const periodEntries: PeriodEntry[] = useMemo(() => {
        return logs.map(log => ({
            id: log.id,
            startDate: log.period_start,
            endDate: log.period_end || log.period_start,
            flow: (log.flow_intensity?.toLowerCase() || 'medium') as any,
            symptoms: log.symptoms || [],
            notes: log.notes || ''
        }))
    }, [logs])

    // Load period logs and insights
    useEffect(() => {
        loadLogs()
    }, [])

    const fetchInsights = async (lastPeriod: string, avgCycle: number, token: string | null) => {
        setLoadingInsights(true)
        try {
            const insights = await cycleApi.getInsights(token, lastPeriod, avgCycle)
            setCycleInsights(insights)
        } catch (err) {
            console.error('Failed to load insights:', err)
            setCycleInsights(null)
        } finally {
            setLoadingInsights(false)
        }
    }

    const loadLogs = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await periodApi.getAll()
            setLogs(data || [])

            // Show page immediately; load insights in background so we never block the UI
            setLoading(false)

            // Compute last period and avg cycle: from logs or defaults for first-time users
            let lastPeriod: string
            let avgCycle = 28
            if (data && data.length > 0) {
                const sorted = [...data].sort((a, b) => b.period_start.localeCompare(a.period_start))
                lastPeriod = sorted[0].period_start
                if (sorted.length >= 2) {
                    const cycles: number[] = []
                    for (let i = 0; i < sorted.length - 1; i++) {
                        const diff = Math.round(
                            (parseDate(sorted[i].period_start).getTime() - parseDate(sorted[i + 1].period_start).getTime()) / 86400000
                        )
                        if (diff > 15 && diff < 60) cycles.push(diff)
                    }
                    if (cycles.length > 0) {
                        avgCycle = Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length)
                    }
                }
            } else {
                const d = new Date()
                d.setDate(d.getDate() - 28)
                lastPeriod = formatDate(d)
            }

            const { session } = await periodApi.getSession()
            fetchInsights(lastPeriod, avgCycle, session?.access_token ?? null)
        } catch (err: any) {
            console.error('[PeriodTracker] Failed to load logs:', err)
            setError(err?.message || 'Failed to load period data')
            setLoading(false)
        }
    }

    const handleSaveEntry = async (entry: PeriodEntry) => {
        setError(null)
        try {
            if (editingEntry) {
                await periodApi.updateLog(entry.id, {
                    period_end: entry.endDate !== entry.startDate ? entry.endDate : undefined,
                    notes: entry.notes || undefined,
                    flow_intensity: (entry.flow.charAt(0).toUpperCase() + entry.flow.slice(1)) as any,
                    symptoms: entry.symptoms,
                })
            } else {
                await periodApi.logPeriod(
                    entry.startDate,
                    entry.endDate !== entry.startDate ? entry.endDate : undefined,
                    entry.notes || undefined,
                    (entry.flow.charAt(0).toUpperCase() + entry.flow.slice(1)) as any,
                    entry.symptoms
                )
            }
            setIsLoggerOpen(false)
            setEditingEntry(null)
            setSelectedDate(null)
            await loadLogs()
        } catch (err: any) {
            console.error('[PeriodTracker] Save failed:', err)
            setError(err?.message || 'Failed to save period log')
        }
    }

    const handleDeleteEntry = async (id: string) => {
        try {
            await periodApi.deleteLog(id)
            setIsLoggerOpen(false)
            setEditingEntry(null)
            setSelectedDate(null)
            await loadLogs()
        } catch (err: any) {
            console.error('[PeriodTracker] Delete failed:', err)
            setError(err?.message || 'Failed to delete')
        }
    }

    const handleSignOut = async () => {
        await signOut()
        navigate('/auth')
    }

    const handleNavigate = (path: string) => {
        navigate(path)
    }

    // 

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-neutral-600">Loading period tracker...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="print:hidden">
                <Sidebar onNavigate={handleNavigate} />
            </div>

            <main className="ml-20">
                {/* Header */}
                <header className="bg-white border-b border-neutral-100 px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-400">Wellness</p>
                            <h1 className="text-2xl font-semibold text-neutral-800">Period Tracker</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setSelectedDate(new Date())
                                    setEditingEntry(null)
                                    setIsLoggerOpen(true)
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Log Period
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

                <div className="p-8">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-red-700">{error}</p>
                            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
                        </div>
                    )}

                    {/* Cycle Insights Card - RapidAPI + Python analysis */}
                    {(loadingInsights || cycleInsights) && (
                        <div className="bg-white rounded-3xl p-6 shadow-xl border border-pink-100 mb-8 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-bl-full -mr-10 -mt-10 opacity-50" />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </span>
                                        AI Cycle Insights
                                    </h3>
                                    <button
                                        onClick={() => {
                                            const sorted = [...logs].sort((a, b) => b.period_start.localeCompare(a.period_start))
                                            let lastPeriod: string
                                            let avgCycle = 28
                                            if (sorted.length > 0) {
                                                lastPeriod = sorted[0].period_start
                                                if (sorted.length >= 2) {
                                                    const cycles: number[] = []
                                                    for (let i = 0; i < sorted.length - 1; i++) {
                                                        const diff = Math.round(
                                                            (parseDate(sorted[i].period_start).getTime() - parseDate(sorted[i + 1].period_start).getTime()) / 86400000
                                                        )
                                                        if (diff > 15 && diff < 60) cycles.push(diff)
                                                    }
                                                    if (cycles.length > 0) avgCycle = Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length)
                                                }
                                            } else {
                                                const d = new Date()
                                                d.setDate(d.getDate() - 28)
                                                lastPeriod = formatDate(d)
                                            }
                                            periodApi.getSession().then(({ session }) =>
                                                fetchInsights(lastPeriod, avgCycle, session?.access_token ?? null)
                                            )
                                        }}
                                        disabled={loadingInsights}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-pink-200 text-pink-700 text-sm font-medium hover:bg-pink-50 transition-colors disabled:opacity-50"
                                    >
                                        {loadingInsights ? (
                                            <LoadingSpinner size="sm" />
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        )}
                                        Refresh
                                    </button>
                                </div>

                                {logs.length === 0 && (
                                    <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                                        Log your period for personalized insights and predictions.
                                    </div>
                                )}

                                {loadingInsights && !cycleInsights ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                        <div className="h-24 bg-neutral-100 rounded-2xl animate-pulse" />
                                        <div className="h-24 bg-neutral-100 rounded-2xl animate-pulse" />
                                    </div>
                                ) : cycleInsights && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-sm text-neutral-500 uppercase tracking-wider font-semibold mb-1">Current Phase</p>
                                                <p className="text-2xl font-bold text-pink-600 mb-2">{cycleInsights.current_phase || '—'}</p>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {cycleInsights.symptoms?.map((sym: string, i: number) => (
                                                        <span key={i} className="px-2 py-1 rounded-md bg-pink-50 text-pink-700 text-xs font-medium">
                                                            {sym}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-neutral-50 rounded-2xl p-4">
                                                <p className="text-sm font-medium text-neutral-700 mb-2">Daily Recommendation</p>
                                                <ul className="space-y-2">
                                                    {(cycleInsights.insights && cycleInsights.insights.length > 0)
                                                        ? cycleInsights.insights.slice(0, 3).map((insight: string, i: number) => (
                                                            <li key={i} className="text-sm text-neutral-600 flex items-start gap-2">
                                                                <span className="text-pink-400 mt-1">•</span>
                                                                {insight}
                                                            </li>
                                                        ))
                                                        : (
                                                            <li className="text-sm text-neutral-600 flex items-start gap-2">
                                                                <span className="text-pink-400 mt-1">•</span>
                                                                {cycleInsights.daily_insight || 'Stay hydrated and track your symptoms.'}
                                                            </li>
                                                        )}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Next period, ovulation, fertile window - from RapidAPI */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                                            {(cycleInsights.next_period_start || cycleInsights.analysis?.next_predicted_periods?.[0]) && (
                                                <div className="bg-white rounded-2xl p-4 border border-pink-100 shadow-sm">
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Next Period Start</p>
                                                    <p className="text-lg font-bold text-pink-600">
                                                        {(cycleInsights.next_period_start || cycleInsights.analysis?.next_predicted_periods?.[0])
                                                            ? new Date((cycleInsights.next_period_start || cycleInsights.analysis?.next_predicted_periods?.[0]) + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                            : '—'}
                                                    </p>
                                                </div>
                                            )}
                                            {cycleInsights.ovulation_date && (
                                                <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm">
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Ovulation Date</p>
                                                    <p className="text-lg font-bold text-purple-600">
                                                        {new Date(cycleInsights.ovulation_date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            )}
                                            {(cycleInsights.fertile_window?.start || cycleInsights.fertile_window?.end) && (
                                                <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm">
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Fertile Window</p>
                                                    <p className="text-sm font-semibold text-purple-700">
                                                        {cycleInsights.fertile_window.start && cycleInsights.fertile_window.end
                                                            ? `${new Date(cycleInsights.fertile_window.start + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(cycleInsights.fertile_window.end + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                                            : cycleInsights.fertile_window.start || cycleInsights.fertile_window.end || '—'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Phase predictions (next 7 days or so) */}
                                        {cycleInsights.predictions && Object.keys(cycleInsights.predictions).length > 0 && (
                                            <div className="mt-6 pt-6 border-t border-pink-100">
                                                <h4 className="text-md font-semibold text-neutral-800 mb-3">Upcoming Phase Predictions</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(cycleInsights.predictions)
                                                        .slice(0, 14)
                                                        .map(([date, pred]: any) => (
                                                            <span
                                                                key={date}
                                                                className="px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-100 text-xs font-medium text-neutral-700"
                                                                title={typeof pred.probability === 'number' ? `${Math.round(pred.probability * 100)}%` : ''}
                                                            >
                                                                {new Date(date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: {pred.phase || '—'}
                                                            </span>
                                                        ))}
                                                </div>
                                            </div>
                                        )}

                                        {cycleInsights.analysis && (
                                            <div className="mt-6 pt-6 border-t border-pink-100">
                                                <h4 className="text-md font-semibold text-neutral-800 mb-4">Cycle Phase Analysis</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                                    <div>
                                                        {cycleInsights.analysis.phase_plot && (
                                                            <img
                                                                src={cycleInsights.analysis.phase_plot}
                                                                alt="Cycle Phase Distribution"
                                                                className="w-full rounded-xl border border-neutral-100 shadow-sm"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
                                                            <p className="text-xs text-neutral-500 uppercase tracking-wide">Configured Cycle Length</p>
                                                            <p className="text-xl font-bold text-neutral-800">{cycleInsights.analysis.cycle_length} Days</p>
                                                        </div>
                                                        <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
                                                            <p className="text-xs text-neutral-500 uppercase tracking-wide">Next Predicted Start</p>
                                                            <p className="text-xl font-bold text-pink-600">
                                                                {cycleInsights.analysis.next_predicted_periods?.[0] || 'Unknown'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}


                    {/* Debug Info for User - Only visible if there's an issue or specifically requested */}
                    {
                        cycleInsights?.debug_info && !cycleInsights?.analysis && (
                            <div className="bg-orange-50 border border-orange-200 rounded-3xl p-6 mb-8">
                                <h4 className="font-semibold text-orange-800 mb-2">Debug Information (Analysis Missing)</h4>
                                <div className="text-sm text-orange-700 font-mono space-y-1">
                                    <p>DB Logs Fetched: {cycleInsights.debug_info.db?.fetched ? 'Yes' : 'No'} ({cycleInsights.debug_info.db?.logCount} logs)</p>
                                    {cycleInsights.debug_info.db?.error && <p>DB Error: {JSON.stringify(cycleInsights.debug_info.db.error)}</p>}
                                    <p>Python Script: {cycleInsights.debug_info.python?.success ? 'Success' : 'Failed'}</p>
                                    {cycleInsights.debug_info.python?.error && <p>Python Log: {cycleInsights.debug_info.python.error}</p>}
                                    <p>User Avg Cycle: {cycleInsights.debug_info.user_avg_cycle}</p>
                                </div>
                            </div>
                        )
                    }

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                        {/* Middle Column: Calendar and Insights */}
                        <div className="lg:col-span-2 space-y-6">
                            <MenstrualCalendar
                                periods={periodEntries}
                                selectedDate={selectedDate}
                                onDateClick={(d) => {
                                    setSelectedDate(d)
                                    setEditingEntry(null)
                                    setIsLoggerOpen(true)
                                }}
                            />

                            <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">Cycle Insights Engine</h3>
                            <CycleInsights periods={periodEntries} />
                        </div>

                        {/* Right Column: History, Due Date, PCOS */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                                <PeriodHistory
                                    periods={periodEntries}
                                    onEdit={(entry) => {
                                        setEditingEntry(entry)
                                        setSelectedDate(null)
                                        setIsLoggerOpen(true)
                                    }}
                                />
                            </div>

                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                                <DueDateCalculator />
                            </div>

                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                                <PCOSClassifier />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {isLoggerOpen && (
                <PeriodLogger
                    selectedDate={selectedDate}
                    existingPeriod={editingEntry}
                    onSave={handleSaveEntry}
                    onDelete={handleDeleteEntry}
                    onClose={() => {
                        setIsLoggerOpen(false)
                        setEditingEntry(null)
                        setSelectedDate(null)
                    }}
                />
            )}
        </div >
    )
}
