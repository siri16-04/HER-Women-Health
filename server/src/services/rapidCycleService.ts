import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { supabase } from '../lib/supabase.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface CycleInput {
    last_period_date: string // YYYY-MM-DD
    avg_cycle_length: number
    token?: string
}

export interface RapidCycleResponse {
    current_phase: string
    next_period_start: string
    ovulation_date: string
    fertile_window: {
        start: string
        end: string
    }
    symptoms: string[]
    daily_insight: string
    predictions: {
        [date: string]: {
            phase: string
            probability: number
        }
    }
    analysis?: {
        cycle_length: number
        next_predicted_periods: string[]
        phase_plot: string // Base64 image
    }
    debug_info?: any
}

// Helper to run Python script
const runPythonAnalysis = async (data: CycleInput): Promise<any> => {
    return new Promise((resolve, reject) => {
        console.log('[Python Analysis] Starting with input:', JSON.stringify({ ...data, history: `[${(data as any).history?.length || 0} items]` }))
        // Adjust path to point to server/python/cycle_analysis.py
        // We are in server/src/services, so we go up to server/src, then server, then python
        const scriptPath = path.join(__dirname, '../../python/cycle_analysis.py')

        const pythonProcess = spawn('python', [scriptPath])

        let output = ''
        let errorOutput = ''

        // Send input data to stdin
        pythonProcess.stdin.write(JSON.stringify(data))
        pythonProcess.stdin.end()

        pythonProcess.stdout.on('data', (chunk) => {
            output += chunk.toString()
        })

        pythonProcess.stderr.on('data', (chunk) => {
            errorOutput += chunk.toString()
            console.error('[Python Analysis] stderr:', chunk.toString())
        })

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('[Python Analysis] Error:', errorOutput)
                reject(new Error(`Python script exited with code ${code}: ${errorOutput}`))
                return
            }
            try {
                // console.log('[Python Analysis] Raw Output:', output)
                const parsed = JSON.parse(output)
                console.log('[Python Analysis] Success. Parsed keys:', Object.keys(parsed))
                resolve(parsed)
            } catch (e) {
                console.error('[Python Analysis] Parse Error:', output)
                reject(new Error('Failed to parse Python output'))
            }
        })
    })
}

// Built-in fallback: compute phase, next period, ovulation, fertile window, daily insight (no RapidAPI or Python needed)
function builtInInsights(lastPeriodDate: string, avgCycleLength: number): Partial<RapidCycleResponse> {
    const last = new Date(lastPeriodDate + 'T00:00:00')
    const today = new Date()
    const msPerDay = 24 * 60 * 60 * 1000
    const daysSinceLast = Math.floor((today.getTime() - last.getTime()) / msPerDay)

    // Next period
    const nextPeriod = new Date(last.getTime() + avgCycleLength * msPerDay)
    const nextPeriodStr = nextPeriod.toISOString().slice(0, 10)

    // Ovulation ~14 days before next period (mid-cycle)
    const ovulation = new Date(nextPeriod.getTime() - 14 * msPerDay)
    const ovulationStr = ovulation.toISOString().slice(0, 10)

    // Fertile window: ~5 days before ovulation through ovulation day
    const fertileStart = new Date(ovulation.getTime() - 5 * msPerDay)
    const fertileEnd = new Date(ovulation.getTime() + 1 * msPerDay)

    // Current phase by day of cycle (day 1 = first day of period)
    const dayOfCycle = (daysSinceLast % avgCycleLength) || (daysSinceLast === 0 ? 1 : avgCycleLength)
    let currentPhase = 'Follicular'
    if (dayOfCycle <= 5) currentPhase = 'Menstruation'
    else if (dayOfCycle <= avgCycleLength - 14) currentPhase = 'Follicular'
    else if (dayOfCycle <= avgCycleLength - 13) currentPhase = 'Ovulation'
    else currentPhase = 'Luteal'

    const phaseTips: Record<string, string> = {
        Menstruation: 'Rest when needed. Iron-rich foods and hydration can help.',
        Follicular: 'Good time for exercise. Energy often rises in this phase.',
        Ovulation: 'Peak fertility. Stay hydrated and maintain a balanced diet.',
        Luteal: 'Some may feel mood or energy shifts. Gentle movement and sleep help.'
    }

    return {
        current_phase: currentPhase,
        next_period_start: nextPeriodStr,
        ovulation_date: ovulationStr,
        fertile_window: {
            start: fertileStart.toISOString().slice(0, 10),
            end: fertileEnd.toISOString().slice(0, 10)
        },
        symptoms: [],
        daily_insight: phaseTips[currentPhase] || 'Stay hydrated and track your symptoms.',
        predictions: {}
    }
}

// Normalize RapidAPI response (different APIs use different field names)
function normalizeRapidApiResponse(raw: any): Partial<RapidCycleResponse> {
    if (!raw || typeof raw !== 'object') return {}
    return {
        current_phase: raw.current_phase ?? raw.phase ?? raw.menstrual_phase ?? 'Follicular',
        next_period_start: raw.next_period_start ?? raw.next_period ?? raw.predicted_period ?? raw.nextPeriodStart ?? '',
        ovulation_date: raw.ovulation_date ?? raw.ovulation ?? raw.ovulationDate ?? '',
        fertile_window: raw.fertile_window ?? raw.fertileWindow ?? (raw.fertile_start && raw.fertile_end
            ? { start: raw.fertile_start, end: raw.fertile_end }
            : { start: '', end: '' }),
        symptoms: Array.isArray(raw.symptoms) ? raw.symptoms : (raw.common_symptoms ? [].concat(raw.common_symptoms) : []),
        daily_insight: raw.daily_insight ?? raw.insight ?? raw.recommendation ?? raw.daily_insights?.[0] ?? 'Stay hydrated and track your symptoms.',
        predictions: raw.predictions ?? raw.phase_predictions ?? raw.daily_predictions ?? {}
    }
}

async function callRapidApi(apiKey: string, apiHost: string, lastPeriodDate: string, avgCycleLength: number): Promise<any> {
    const baseUrl = `https://${apiHost}`
    const headers: Record<string, string> = {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': apiHost,
        'Content-Type': 'application/json'
    }
    const q = `last_period_date=${encodeURIComponent(lastPeriodDate)}&avg_cycle_length=${avgCycleLength}`
    const postBody = { last_period_date: lastPeriodDate, avg_cycle_length: avgCycleLength }
    let lastStatus = 0
    let lastBody = ''

    const tryFetch = async (path: string, method: 'GET' | 'POST'): Promise<Response> => {
        const url = method === 'GET' ? `${baseUrl}${path}?${q}` : `${baseUrl}${path}`
        const res = await fetch(url, {
            method,
            headers,
            ...(method === 'POST' ? { body: JSON.stringify(postBody) } : {})
        })
        lastStatus = res.status
        lastBody = await res.text()
        return res
    }

    const parseOk = (): any => {
        try {
            return normalizeRapidApiResponse(JSON.parse(lastBody))
        } catch {
            return {}
        }
    }

    // 1. If RAPID_API_PATH is set, try that first (exact path from RapidAPI docs)
    const envPath = process.env.RAPID_API_PATH
    if (envPath) {
        const path = envPath.startsWith('/') ? envPath : `/${envPath}`
        let res = await tryFetch(path, 'GET')
        if (res.ok) return parseOk()
        res = await tryFetch(path, 'POST')
        if (res.ok) return parseOk()
    }

    // 2. Try root GET then POST
    let res = await tryFetch('/', 'GET')
    if (res.ok) return parseOk()
    res = await tryFetch('/', 'POST')
    if (res.ok) return parseOk()

    // 3. Try common paths (GET then POST for each)
    const paths = ['/get-phase', '/get-phase-predictions', '/predict', '/insights', '/phase', '/get-insights', '/menstrual-cycle', '/cycle']
    for (const path of paths) {
        res = await tryFetch(path, 'GET')
        if (res.ok) return parseOk()
        res = await tryFetch(path, 'POST')
        if (res.ok) return parseOk()
    }

    // Log so you can see why it failed (e.g. wrong path or key)
    console.warn('[RapidCycle] RapidAPI did not return 200. Last response:', lastStatus, lastBody.slice(0, 200))
    return {}
}

export const getRapidCycleInsights = async (data: CycleInput): Promise<RapidCycleResponse> => {
    console.log('[RapidCycle] Request received for:', data.last_period_date)
    const apiKey = process.env.RAPID_API_KEY
    const apiHost = process.env.RAPID_API_HOST

    // 0. Fetch History from DB if token is present
    let history: any[] = []
    let userAvgCycle = data.avg_cycle_length
    let dbDebug = { fetched: false, logCount: 0, error: null as any }

    if (data.token) {
        try {
            console.log('[RapidCycle] Validating token...')
            const { data: { user }, error: authError } = await supabase.auth.getUser(data.token)

            if (user && !authError) {
                console.log('[RapidCycle] User found:', user.id)
                const { data: logs, error: dbError } = await supabase
                    .from('period_logs')
                    .select('period_start, period_end')
                    .eq('user_id', user.id)
                    .order('period_start', { ascending: false })

                if (logs) {
                    console.log(`[RapidCycle] Fetched ${logs.length} logs from DB`)
                    history = logs
                    dbDebug.fetched = true
                    dbDebug.logCount = logs.length

                    // Basic calculation of average cycle length
                    if (logs.length >= 2) {
                        let totalDays = 0
                        let counts = 0
                        for (let i = 0; i < logs.length - 1; i++) {
                            const current = new Date(logs[i].period_start).getTime()
                            const previous = new Date(logs[i + 1].period_start).getTime()
                            const diff = Math.round((current - previous) / (1000 * 60 * 60 * 24))
                            if (diff > 15 && diff < 45) {
                                totalDays += diff
                                counts++
                            }
                        }
                        if (counts > 0) {
                            userAvgCycle = Math.round(totalDays / counts)
                            console.log(`[RapidCycle] Calculated user average cycle: ${userAvgCycle}`)
                        }
                    }
                }
            } else {
                console.warn('[RapidCycle] Token invalid or user not found:', authError)
                dbDebug.error = 'Token invalid or user not found'
            }
        } catch (dbErr) {
            console.error('[RapidCycle] Database Error:', dbErr)
            dbDebug.error = dbErr
        }
    } else {
        console.log('[RapidCycle] No token provided')
        dbDebug.error = 'No token provided'
    }

    // Ensure Python has at least one history entry (it requires history)
    const historyForPython = history.length > 0
        ? history
        : [{ period_start: data.last_period_date, period_end: data.last_period_date }]

    try {
        let apiData: Partial<RapidCycleResponse> = {}

        // 1. Call RapidAPI only if credentials are configured
        if (apiKey && apiHost && apiKey !== 'your_rapidapi_key_here') {
            try {
                console.log('[RapidCycle] Calling RapidAPI...')
                apiData = await callRapidApi(apiKey, apiHost, data.last_period_date, userAvgCycle)
                if (Object.keys(apiData).length > 0) {
                    console.log('[RapidCycle] API data received and normalized')
                } else {
                    console.warn('[RapidCycle] RapidAPI returned no usable data (fallback will be used)')
                }
            } catch (apiError) {
                console.error('[RapidCycle] API Request Failed:', apiError)
            }
        } else {
            console.log('[RapidCycle] RapidAPI not configured; using Python + defaults only')
        }

        // 2. Run Python Analysis (always, for phase plot and next predicted periods)
        let pythonAnalysis = null
        let pythonDebug = null
        try {
            console.log('[RapidCycle] Running Python analysis...')
            const analysisInput = {
                last_period_date: data.last_period_date,
                avg_cycle_length: userAvgCycle,
                history: historyForPython
            }
            pythonAnalysis = await runPythonAnalysis(analysisInput)
            if (pythonAnalysis?.error) {
                throw new Error(pythonAnalysis.error)
            }
            console.log('[RapidCycle] Python analysis completed')
            pythonDebug = { success: true }
        } catch (pyError: any) {
            console.error('[RapidCycle] Python Analysis Failed:', pyError)
            pythonDebug = { success: false, error: pyError.message }
        }

        // 3. Built-in fallback (always works, no RapidAPI or Python required)
        const fallback = builtInInsights(data.last_period_date, userAvgCycle)

        // 4. Merge: RapidAPI > Python > built-in fallback
        const nextPeriod = apiData.next_period_start || pythonAnalysis?.next_predicted_periods?.[0] || fallback.next_period_start || ''
        const fertile = apiData.fertile_window?.start ? apiData.fertile_window : (fallback.fertile_window?.start ? fallback.fertile_window : { start: '', end: '' })
        return {
            current_phase: apiData.current_phase || fallback.current_phase || 'Follicular',
            next_period_start: nextPeriod,
            ovulation_date: apiData.ovulation_date || fallback.ovulation_date || '',
            fertile_window: fertile,
            symptoms: (apiData.symptoms?.length ? apiData.symptoms : fallback.symptoms) || [],
            daily_insight: apiData.daily_insight || fallback.daily_insight || 'Stay hydrated and track your symptoms.',
            predictions: (apiData.predictions && Object.keys(apiData.predictions).length > 0) ? apiData.predictions : (fallback.predictions || {}),
            analysis: pythonAnalysis?.error ? null : pythonAnalysis,
            debug_info: {
                db: dbDebug,
                python: pythonDebug,
                history_length: history.length,
                user_avg_cycle: userAvgCycle,
                rapidapi_used: !!(apiKey && apiHost && apiKey !== 'your_rapidapi_key_here')
            }
        }
    } catch (error: any) {
        console.error('[RapidCycle] Service Error:', error.message)
        throw error
    }
}
