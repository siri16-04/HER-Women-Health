import { Router, Request, Response } from 'express'
import { getRapidCycleInsights } from '../services/rapidCycleService.js'

export const cycleRouter = Router()

cycleRouter.get('/insights', async (req: Request, res: Response) => {
    try {
        let last_period_date = req.query.last_period_date as string | undefined
        let avg_cycle_length = Number(req.query.avg_cycle_length)

        // Defaults when no logs: use ~28 days ago as last period, 28-day cycle
        if (!last_period_date) {
            const d = new Date()
            d.setDate(d.getDate() - 28)
            last_period_date = d.toISOString().slice(0, 10)
        }
        if (!avg_cycle_length || Number.isNaN(avg_cycle_length)) {
            avg_cycle_length = 28
        }

        const authHeader = req.headers.authorization
        const token = authHeader && authHeader.split(' ')[1]

        const insights = await getRapidCycleInsights({
            last_period_date,
            avg_cycle_length,
            token
        })

        res.json(insights)
    } catch (error) {
        console.error('Cycle route error:', error)
        res.status(500).json({ error: 'Failed to fetch cycle insights' })
    }
})
