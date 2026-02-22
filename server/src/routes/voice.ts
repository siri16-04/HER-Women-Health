import { Router, Request, Response } from 'express'
import express from 'express'
import { getElevenLabsService, scanScripts, ScanPhase } from '../services/elevenLabsService.js'

export const voiceRouter = Router()

// Speech-to-text: transcribe uploaded audio (ElevenLabs Scribe)
voiceRouter.post(
  '/transcribe',
  express.raw({ type: ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg'], limit: '25mb' }),
  async (req: Request, res: Response) => {
    try {
      const audioBuffer = req.body as Buffer
      if (!audioBuffer?.length) {
        res.status(400).json({ error: 'No audio data' })
        return
      }
      const contentType = (req.headers['content-type'] || 'audio/webm').split(';')[0]!.trim()
      const service = getElevenLabsService()
      const text = await service.transcribe(audioBuffer, contentType)
      res.json({ text })
    } catch (error) {
      console.error('Transcribe error:', error)
      res.status(500).json({ error: 'Transcription failed' })
    }
  }
)

// Stream speech audio for a given text
voiceRouter.post('/stream', async (req: Request, res: Response) => {
  try {
    const { text, phase } = req.body

    // Get text either directly or from phase scripts
    let speechText: string
    if (text) {
      speechText = text
    } else if (phase && phase in scanScripts) {
      speechText = scanScripts[phase as ScanPhase]
    } else {
      res.status(400).json({ error: 'text or phase is required' })
      return
    }

    const service = getElevenLabsService()
    const audioBuffer = await service.generateSpeech(speechText)

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
    })

    res.send(audioBuffer)
  } catch (error) {
    console.error('Voice stream error:', error)
    res.status(500).json({ error: 'Failed to generate speech' })
  }
})

// Get available scripts
voiceRouter.get('/scripts', (_req: Request, res: Response) => {
  res.json({
    phases: Object.keys(scanScripts) as ScanPhase[],
    scripts: scanScripts,
  })
})

// Get script for a specific phase
voiceRouter.get('/scripts/:phase', (req: Request, res: Response) => {
  const phase = req.params.phase as string

  if (!Object.hasOwn(scanScripts, phase)) {
    res.status(404).json({ error: 'Phase not found' })
    return
  }

  res.json({
    phase,
    text: scanScripts[phase as ScanPhase],
  })
})
