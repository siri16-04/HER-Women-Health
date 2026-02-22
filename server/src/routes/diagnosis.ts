import { Router, Request, Response } from 'express'
import { getGeminiService } from '../services/geminiService.js'
import type { IntakeData, BiometricSummary } from '../types/index.js'

export const diagnosisRouter = Router()

interface AnalyzeRequest {
  intake: IntakeData
  biometrics: BiometricSummary | null
}

// Analyze intake data and biometrics with Gemini
diagnosisRouter.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { intake, biometrics } = req.body as AnalyzeRequest

    console.log('Received diagnosis request:', JSON.stringify({ intake, biometrics }, null, 2))

    if (!intake || !intake.lifeStage || !intake.selectedBodyParts) {
      console.error('Invalid intake data:', intake)
      res.status(400).json({ error: 'Invalid intake data' })
      return
    }

    console.log('Calling Gemini API...')
    const service = getGeminiService()
    const result = await service.analyzeDiagnosis(intake, biometrics)
    console.log('Gemini response:', JSON.stringify(result, null, 2))

    res.json(result)
  } catch (error) {
    console.error('Diagnosis error:', error)

    // Return a safe fallback response with 200 so client can use it
    res.status(200).json({
      urgencyLevel: 'MODERATE',
      urgencyReason: 'Unable to complete full AI analysis - showing general guidance',
      primaryAssessment: 'Based on your reported symptoms, please consult with a healthcare provider for proper evaluation. The AI analysis encountered a technical issue.',
      differentialConsiderations: [],
      redFlags: [],
      recommendations: [
        'Contact your primary care physician',
        'If experiencing severe symptoms, seek immediate medical attention',
        'Bring your biometric readings to your appointment',
      ],
      disclaimer: 'This assessment could not be fully completed due to a technical issue. Please consult with a qualified healthcare provider.',
      _error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})
