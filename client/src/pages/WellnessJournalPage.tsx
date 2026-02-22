import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { wellnessApi } from '../services/supabaseApi'
import LoadingSpinner from '../components/common/LoadingSpinner'

// Types
interface WellnessLog {
    id: string
    log_date: string
    mood: number | null
    energy: number | null
    sleep_hours: number | null
    hydration: number | null
    notes: string | null
}

// Sidebar Navigation
function Sidebar({ onNavigate }: { onNavigate: (path: string) => void }) {
    const navItems = [
        { icon: 'dashboard', label: 'Dashboard', path: '/report' },
        { icon: 'scan', label: 'New Scan', path: '/dashboard' },
        { icon: 'wellness', label: 'Wellness', path: '/wellness', active: true },
        { icon: 'period', label: 'Period Tracker', path: '/period-tracker' },
        { icon: 'history', label: 'History', path: '/history' },
    ]

    const renderIcon = (icon: string, active: boolean) => {
        const color = active ? '#fff' : '#164A31'
        switch (icon) {
            case 'dashboard': return <svg className="w-5 h-5" viewBox="0 0 24 24" fill={color}><path d="M4 13h6a1 1 0 001-1V4a1 1 0 00-1-1H4a1 1 0 00-1 1v8a1 1 0 001 1zm0 8h6a1 1 0 001-1v-4a1 1 0 00-1-1H4a1 1 0 00-1 1v4a1 1 0 001 1zm10 0h6a1 1 0 001-1v-8a1 1 0 00-1-1h-6a1 1 0 00-1 1v8a1 1 0 001 1zm0-18v4a1 1 0 001 1h6a1 1 0 001-1V4a1 1 0 00-1-1h-6a1 1 0 00-1 1z" /></svg>
            case 'scan': return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
            case 'wellness': return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            case 'period': return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            case 'history': return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            default: return null
        }
    }

    return (
        <aside className="fixed left-0 top-0 h-full w-20 bg-white border-r border-neutral-100 flex flex-col items-center py-6 z-50">
            <img src="/logo.png" alt="HER" className="w-12 h-12 object-contain" />
            <nav className="mt-8 flex flex-col gap-2">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => onNavigate(item.path)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${item.active ? 'bg-brand-dark shadow-lg' : 'hover:bg-brand-50'}`}
                        title={item.label}
                    >
                        {renderIcon(item.icon, !!item.active)}
                    </button>
                ))}
            </nav>
        </aside>
    )
}

const MOODS = [
    { value: 1, emoji: '😢', label: 'Sad' },
    { value: 2, emoji: '😔', label: 'Low' },
    { value: 3, emoji: '😐', label: 'Okay' },
    { value: 4, emoji: '🙂', label: 'Good' },
    { value: 5, emoji: '😁', label: 'Great' },
]

const ENERGY_LEVELS = [
    { value: 1, label: 'Exhausted' },
    { value: 2, label: 'Tired' },
    { value: 3, label: 'Moderate' },
    { value: 4, label: 'Energetic' },
    { value: 5, label: 'Charged' },
]

export default function WellnessJournalPage() {
    const navigate = useNavigate()
    const { signOut } = useAuth()
    const [loading, setLoading] = useState(true)
    const [logs, setLogs] = useState<WellnessLog[]>([])
    const [todayLog, setTodayLog] = useState<Partial<WellnessLog>>({
        mood: null,
        energy: null,
        sleep_hours: 7,
        hydration: 0,
        notes: '',
    })
    const [saving, setSaving] = useState(false)

    const [successMessage, setSuccessMessage] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [allLogs, today] = await Promise.all([
                wellnessApi.getAll(),
                wellnessApi.getToday()
            ])
            setLogs(allLogs)
            if (today) {
                setTodayLog(today)
            }
        } catch (err) {
            console.error('Failed to load wellness data:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleManualSave = async () => {
        try {
            setSaving(true)
            setSuccessMessage('')
            const todayDate = new Date().toISOString().split('T')[0]
            await wellnessApi.upsert({
                log_date: todayDate,
                mood: todayLog.mood ?? undefined,
                energy: todayLog.energy ?? undefined,
                sleep_hours: todayLog.sleep_hours ?? undefined,
                hydration: todayLog.hydration ?? undefined,
                notes: todayLog.notes ?? undefined,
            })

            // Reload to sync state
            const saved = await wellnessApi.getToday()
            if (saved) setTodayLog(saved)
            setLogs(prev => {
                const others = prev.filter(l => l.log_date !== todayDate)
                return [saved!, ...others].sort((a, b) => b.log_date.localeCompare(a.log_date))
            })

            setSuccessMessage('Entry saved successfully!')
            setTimeout(() => setSuccessMessage(''), 3000)
        } catch (err) {
            console.error('Failed to save log:', err)
            alert('Failed to save entry')
        } finally {
            setSaving(false)
        }
    }

    // Heatmap generation
    const heatmapGrid = useMemo(() => {
        const today = new Date()
        const grid: { date: Date; log?: WellnessLog }[] = []

        // Generate last 28 days
        for (let i = 27; i >= 0; i--) {
            const d = new Date(today)
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().split('T')[0]
            const log = logs.find(l => l.log_date === dateStr)
            grid.push({ date: d, log })
        }
        return grid
    }, [logs])

    if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="print:hidden">
                <Sidebar onNavigate={navigate} />
            </div>

            <main className="ml-20 p-8">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <div>
                            <p className="text-sm text-neutral-400">Daily Tracking</p>
                            <h1 className="text-3xl font-bold text-neutral-800 flex items-center gap-3">
                                Wellness Journal
                            </h1>
                        </div>
                    </div>
                    <button onClick={signOut} className="text-sm font-medium text-neutral-500 hover:text-neutral-800">
                        Sign Out
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Logging Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl p-8 shadow-card">
                            <h2 className="text-xl font-semibold text-neutral-800 mb-6">How are you feeling today?</h2>

                            {/* Mood Selector */}
                            <div className="mb-8">
                                <label className="text-sm font-medium text-neutral-500 mb-3 block">Mood</label>
                                <div className="flex justify-between gap-2 max-w-md">
                                    {MOODS.map((m) => (
                                        <button
                                            key={m.value}
                                            onClick={() => setTodayLog(prev => ({ ...prev, mood: m.value }))}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 ${todayLog.mood === m.value
                                                ? 'bg-healing-100 scale-110 shadow-md ring-2 ring-healing-500 ring-offset-2'
                                                : 'hover:bg-neutral-50 grayscale hover:grayscale-0'
                                                }`}
                                        >
                                            <span className="text-4xl filter drop-shadow-sm">{m.emoji}</span>
                                            <span className={`text-xs font-medium ${todayLog.mood === m.value ? 'text-healing-700' : 'text-neutral-400'}`}>
                                                {m.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Energy Slider */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-neutral-500">Energy Level</label>
                                        <span className="text-sm font-bold text-healing-600">
                                            {ENERGY_LEVELS.find(e => e.value === (todayLog.energy || 3))?.label}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        step="1"
                                        value={todayLog.energy || 3}
                                        onChange={(e) => setTodayLog(prev => ({ ...prev, energy: parseInt(e.target.value) }))}
                                        className="w-full h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-healing-500"
                                    />
                                    <div className="flex justify-between text-xs text-neutral-300 mt-1">
                                        <span>Low</span>
                                        <span>High</span>
                                    </div>
                                </div>

                                {/* Sleep Slider */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-neutral-500">Sleep</label>
                                        <span className="text-sm font-bold text-blue-600">{todayLog.sleep_hours || 7} hrs</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="12"
                                        step="0.5"
                                        value={todayLog.sleep_hours || 7}
                                        onChange={(e) => setTodayLog(prev => ({ ...prev, sleep_hours: parseFloat(e.target.value) }))}
                                        className="w-full h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                    <div className="flex justify-between text-xs text-neutral-300 mt-1">
                                        <span>0h</span>
                                        <span>12h+</span>
                                    </div>
                                </div>
                            </div>

                            {/* Hydration Counter */}
                            <div className="mt-8">
                                <div className="flex justify-between mb-4">
                                    <label className="text-sm font-medium text-neutral-500">Hydration (Glasses)</label>
                                    <span className="text-sm font-bold text-cyan-600">{todayLog.hydration || 0} / 8</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setTodayLog(prev => ({ ...prev, hydration: (todayLog.hydration === i + 1 ? i : i + 1) }))}
                                            className={`h-12 flex-1 min-w-[40px] rounded-xl flex items-center justify-center transition-all duration-300 ${(todayLog.hydration || 0) > i
                                                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-200'
                                                : 'bg-neutral-100 text-neutral-300 hover:bg-cyan-50'
                                                }`}
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="mt-8">
                                <label className="text-sm font-medium text-neutral-500 mb-2 block">Daily Notes</label>
                                <textarea
                                    value={todayLog.notes || ''}
                                    onChange={(e) => setTodayLog(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Record symptoms, gratitude, or thoughts..."
                                    rows={3}
                                    className="w-full p-4 bg-neutral-50 rounded-2xl border-none focus:ring-2 focus:ring-healing-200 resize-none text-neutral-700 placeholder-neutral-400"
                                />
                            </div>

                            {/* Save Button */}
                            <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center justify-between">
                                <span className={`text-sm font-medium text-green-600 transition-opacity duration-300 ${successMessage ? 'opacity-100' : 'opacity-0'}`}>
                                    {successMessage}
                                </span>
                                <button
                                    onClick={handleManualSave}
                                    disabled={saving}
                                    className="px-8 py-3 bg-healing-700 hover:bg-healing-800 text-white font-semibold rounded-xl shadow-lg shadow-healing-700/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                            </svg>
                                            Save Entry
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Side Panel: Insights & Heatmap */}
                    <div className="space-y-6">
                        {/* Heatmap Card */}
                        <div className="bg-white rounded-3xl p-6 shadow-card">
                            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Wellness Trends</h3>
                            <div className="grid grid-cols-7 gap-1.5">
                                {heatmapGrid.map((day, i) => {
                                    const mood = day.log?.mood
                                    const color = !mood ? 'bg-neutral-100' :
                                        mood >= 4 ? 'bg-green-400' :
                                            mood === 3 ? 'bg-yellow-400' :
                                                'bg-red-400'

                                    return (
                                        <div key={i} className="flex flex-col items-center gap-1">
                                            <div
                                                className={`w-full aspect-square rounded-lg ${color} transition-all hover:opacity-80`}
                                                title={day.date.toDateString() + (day.log?.mood ? `: Mood ${day.log.mood}` : ' (No entry)')}
                                            />
                                            <span className="text-[10px] text-neutral-300">
                                                {day.date.getDate()}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="flex justify-between items-center mt-4 text-xs text-neutral-400">
                                <span>Past 28 Days</span>
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-400 rounded-full"></div>Low</div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-400 rounded-full"></div>Okay</div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-400 rounded-full"></div>Good</div>
                                </div>
                            </div>
                        </div>

                        {/* Today's Summary */}
                        <div className="bg-gradient-to-br from-healing-50 to-white rounded-3xl p-6 shadow-card border border-healing-100">
                            <h3 className="text-lg font-semibold text-healing-800 mb-1">Morning Insight</h3>
                            <p className="text-sm text-healing-600 mb-4">Based on your recent logs</p>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-neutral-400">Sleep Average</p>
                                        <p className="font-semibold text-neutral-700">
                                            {logs.length > 0
                                                ? (logs.reduce((a, b) => a + (b.sleep_hours || 0), 0) / logs.length).toFixed(1)
                                                : '7.0'} hrs
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-neutral-400">Avg. Hydration</p>
                                        <p className="font-semibold text-neutral-700">
                                            {logs.length > 0
                                                ? Math.round(logs.reduce((a, b) => a + (b.hydration || 0), 0) / logs.length)
                                                : '0'} glasses
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
