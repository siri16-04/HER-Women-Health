import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import os from 'os'
import { getPresageService } from '../services/presageService.js'

export const biometricsRouter = Router()

const MIN_VIDEO_MB = 2
const MIN_VIDEO_BYTES = MIN_VIDEO_MB * 1024 * 1024

// Multer config: store uploaded videos in temp directory
const upload = multer({
  dest: path.join(os.tmpdir(), 'heradx-uploads'),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB max
})

// Start a new biometric scanning session
biometricsRouter.post('/start', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body
    console.log(`[biometrics] START session=${sessionId}`)

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' })
      return
    }

    const service = getPresageService()
    console.log(`[biometrics] Presage mode: ${service.getMode()}`)
    const result = await service.startSession(sessionId)

    res.json(result)
  } catch (error) {
    console.error('Biometrics start error:', error)
    res.status(500).json({ error: 'Failed to start biometric session' })
  }
})

// Process a video frame (legacy frame-by-frame mode)
biometricsRouter.post('/frame', async (req: Request, res: Response) => {
  try {
    const { sessionId, frame, timestamp } = req.body

    if (!sessionId || !frame) {
      res.status(400).json({ error: 'sessionId and frame are required' })
      return
    }

    const service = getPresageService()
    const reading = await service.processFrame(
      sessionId,
      frame,
      timestamp || Date.now()
    )

    console.log(`[biometrics] FRAME session=${sessionId} bpm=${reading.bpm} confidence=${reading.confidence.toFixed(2)}`)
    res.json(reading)
  } catch (error) {
    console.error('Biometrics frame error:', error)
    res.status(500).json({ error: 'Failed to process frame' })
  }
})

// Stop session and get summary (legacy frame-by-frame mode)
biometricsRouter.post('/stop', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body
    console.log(`[biometrics] STOP session=${sessionId}`)

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' })
      return
    }

    const service = getPresageService()
    const summary = await service.stopSession(sessionId)

    console.log(`[biometrics] SUMMARY:`, JSON.stringify(summary))
    res.json(summary)
  } catch (error) {
    console.error('Biometrics stop error:', error)
    res.status(500).json({ error: 'Failed to stop biometric session' })
  }
})

// NEW: Process uploaded WebM video (MediaRecorder pipeline)
biometricsRouter.post(
  '/process-video',
  upload.single('video'),
  async (req: Request, res: Response) => {
    try {
      const file = req.file
      if (!file) {
        res.status(400).json({ error: 'No video file uploaded' })
        return
      }

      console.log(`[biometrics] Received video upload: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
      if (file.size < MIN_VIDEO_BYTES) {
        res.status(400).json({
          error: `Video too small (${(file.size / 1024 / 1024).toFixed(2)}MB). Please scan for the full duration with good lighting.`,
        })
        return
      }

      const service = getPresageService()
      const summary = await service.processVideo(file.path)

      console.log(`[biometrics] VIDEO SUMMARY:`, JSON.stringify(summary))
      res.json(summary)
    } catch (error) {
      console.error('Biometrics process-video error:', error)
      const message = error instanceof Error ? error.message : 'Failed to process video'
      res.status(500).json({ error: message })
    }
  }
)

