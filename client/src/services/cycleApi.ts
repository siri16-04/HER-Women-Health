const getBaseUrl = () =>
    (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') || 'http://localhost:3001'

const INSIGHTS_TIMEOUT_MS = 10_000

export const cycleApi = {
    getInsights: async (token: string | null, lastPeriodDate: string, cycleLength: number = 28) => {
        try {
            const url = `${getBaseUrl()}/api/cycle/insights?last_period_date=${encodeURIComponent(lastPeriodDate)}&avg_cycle_length=${cycleLength}`
            const headers: Record<string, string> = {}
            if (token) headers['Authorization'] = `Bearer ${token}`

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), INSIGHTS_TIMEOUT_MS)
            try {
                const response = await fetch(url, { headers, signal: controller.signal })
                if (!response.ok) throw new Error('Failed to fetch cycle insights')
                return await response.json()
            } finally {
                clearTimeout(timeoutId)
            }
        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
                // Timeout or deliberate cancellation; not a real failure
                return null
            }
            console.error('Cycle API Error:', error)
            return null
        }
    }
}
