import './loadEnv.js'
import express from 'express'
import cors from 'cors'
import { biometricsRouter } from './routes/biometrics.js'
import { getPresageMode, isRealPresage } from './services/presageService.js'
import { diagnosisRouter } from './routes/diagnosis.js'
import { voiceRouter } from './routes/voice.js'
import { clinicsRouter } from './routes/clinics.js'
import { chatRouter } from './routes/chat.js'
import { cycleRouter } from './routes/cycle.js'

console.log('Environment check:')
console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET (' + process.env.GEMINI_API_KEY.slice(0, 8) + '...)' : 'NOT SET')
console.log('- ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? 'SET' : 'NOT SET')
console.log('- PRESAGE_API_KEY:', process.env.PRESAGE_API_KEY ? 'SET' : 'NOT SET')
// PRESAGE_API_URL = per-frame API (POST one frame → get one reading). PRESAGE_VIDEO_API_URL = batch (collect frames → build video → POST once, e.g. Presage Engine Docker).
console.log('- PRESAGE_API_URL (per-frame):', process.env.PRESAGE_API_URL ? 'SET' : 'NOT SET')
console.log('- PRESAGE_VIDEO_API_URL (batch/Docker):', process.env.PRESAGE_VIDEO_API_URL ? 'SET' : 'NOT SET')
const presageMode = getPresageMode()
const presageReal = isRealPresage()
console.log(
  '- Presage vitals:',
  presageMode === 'video_api'
    ? 'Presage Engine (Docker / batch video)'
    : presageMode === 'api'
      ? 'Presage API (direct)'
      : presageMode === 'bridge'
        ? presageReal
          ? 'bridge (real Presage)'
          : 'bridge (mock)'
        : 'simulation'
)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Routes
app.use('/api/biometrics', biometricsRouter)
app.use('/api/diagnosis', diagnosisRouter)
app.use('/api/voice', voiceRouter)
app.use('/api/clinics', clinicsRouter)
app.use('/api/chat', chatRouter)
app.use('/api/cycle', cycleRouter)

// Health check
app.get('/api/health', (_, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  })
})

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`HER server running on http://localhost:${PORT}`)
})
