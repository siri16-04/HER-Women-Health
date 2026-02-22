const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'client', 'src', 'pages', 'PeriodTrackerPage.tsx');
let content = fs.readFileSync(pageFile, 'utf8');

const newImports = `
import { CycleInsights } from '../components/period/CycleInsights'
import { DueDateCalculator } from '../components/period/DueDateCalculator'
import { MenstrualCalendar } from '../components/period/MenstrualCalendar'
import { PCOSClassifier } from '../components/period/PCOSClassifier'
import { PeriodHistory } from '../components/period/PeriodHistory'
import { PeriodLogger } from '../components/period/PeriodLogger'
import type { PeriodEntry } from '../utils/healthcare'
`;
content = content.replace("import LoadingSpinner from '../components/common/LoadingSpinner'", "import LoadingSpinner from '../components/common/LoadingSpinner'\\n" + newImports);

const compStart = content.indexOf('export default function PeriodTrackerPage() {');
let topPart = content.substring(0, compStart);

const newComponent = `export default function PeriodTrackerPage() {
    const navigate = useNavigate()
    const { signOut } = useAuth()

    const [logs, setLogs] = useState<PeriodLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [cycleInsights, setCycleInsights] = useState<any>(null)
    const [loadingInsights, setLoadingInsights] = useState(false)

    // New state for period components
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [editingEntry, setEditingEntry] = useState<PeriodEntry | null>(null)
    const [isLoggerOpen, setIsLoggerOpen] = useState(false)

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
            setLoading(false)

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

    const handleSaveEntry = async (entry: PeriodEntry) => {
        setError(null)
        try {
            if (editingEntry) {
                await periodApi.updateLog(entry.id, {
                    period_end: entry.endDate !== entry.startDate ? entry.endDate : undefined,
                    notes: entry.notes || undefined,
                    flow_intensity: entry.flow.charAt(0).toUpperCase() + entry.flow.slice(1) as any,
                    symptoms: entry.symptoms,
                })
            } else {
                await periodApi.logPeriod(
                    entry.startDate,
                    entry.endDate !== entry.startDate ? entry.endDate : undefined,
                    entry.notes || undefined,
                    entry.flow.charAt(0).toUpperCase() + entry.flow.slice(1) as any,
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
`;

const insightBlockStart = content.indexOf('{/* Cycle Insights Card - RapidAPI + Python analysis */}');
let insightBlockEnd = content.indexOf('{/* Debug Info for User - Only visible if there\\'s an issue or specifically requested */}');
if (insightBlockEnd === -1) {
    insightBlockEnd = content.indexOf('{/* Cycle Stats Row */}');
}

let aiBlock = "";
if (insightBlockStart !== -1 && insightBlockEnd !== -1) {
    aiBlock = content.substring(insightBlockStart, insightBlockEnd);
}

const finalReturn1 = `
    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            <div className="print:hidden">
                <Sidebar onNavigate={navigate} />
            </div>

            <main className="ml-20">
                <header className="bg-white border-b border-neutral-100 px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-400">Wellness</p>
                            <h1 className="text-2xl font-semibold text-neutral-800">Women's Health Hub</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setSelectedDate(new Date())
                                    setEditingEntry(null)
                                    setIsLoggerOpen(true)
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:from-pink-600 hover:to-rose-600 shadow-lg hover:shadow-xl"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Log Period
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-dark text-white rounded-xl text-sm font-medium hover:bg-brand-900"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                            <p className="text-sm text-red-700">{error}</p>
                            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
                        </div>
                    )}
`;

const finalReturn2 = `
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
        </div>
    )
}
`;

const newFileContent = topPart + newComponent + finalReturn1 + aiBlock + finalReturn2;
fs.writeFileSync(pageFile, newFileContent, 'utf8');
console.log("Successfully rewrote PeriodTrackerPage.tsx");
