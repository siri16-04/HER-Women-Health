import { Router, Request, Response } from 'express'
import { getClinicsService } from '../services/clinicsService.js'

export const clinicsRouter = Router()

// Find nearby women's health clinics
clinicsRouter.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius } = req.query

    if (!lat || !lng) {
      res.status(400).json({ error: 'lat and lng query parameters are required' })
      return
    }

    const latitude = parseFloat(lat as string)
    const longitude = parseFloat(lng as string)
    const radiusMeters = radius ? parseInt(radius as string, 10) : 10000

    if (isNaN(latitude) || isNaN(longitude)) {
      res.status(400).json({ error: 'Invalid lat/lng values' })
      return
    }

    const service = getClinicsService()
    const clinics = await service.findNearbyClinics(latitude, longitude, radiusMeters)

    res.json({ clinics })
  } catch (error) {
    console.error('Clinics search error:', error)
    res.status(500).json({ error: 'Failed to search for clinics', clinics: [] })
  }
})
