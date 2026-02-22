import { GoogleGenerativeAI } from '@google/generative-ai'
import { FEMALE_HEALTH_TRIAGE_SYSTEM_PROMPT, buildDiagnosticPrompt, FEMALE_HEALTH_CHAT_SYSTEM_PROMPT } from '../prompts/femaleHealthTriage.js'
import type { IntakeData, BiometricSummary, DiagnosisResult } from '../types/index.js'

export class GeminiService {
  private client: GoogleGenerativeAI
  private modelId = 'gemini-2.5-flash-lite'

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey)
  }

  async analyzeDiagnosis(
    intake: IntakeData,
    biometrics: BiometricSummary | null
  ): Promise<DiagnosisResult> {
    console.log('Creating Gemini model...')
    const model = this.client.getGenerativeModel({
      model: this.modelId,
      systemInstruction: FEMALE_HEALTH_TRIAGE_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    })

    const userPrompt = buildDiagnosticPrompt(intake, biometrics)
    console.log('Sending prompt to Gemini:', userPrompt.slice(0, 200) + '...')

    let result
    try {
      result = await model.generateContent(userPrompt)
    } catch (apiError: any) {
      // Retry with fallback model on 503 (overload)
      if (apiError?.status === 503) {
        console.warn('Gemini primary model overloaded, retrying with fallback model...')
        const fallbackModel = this.client.getGenerativeModel({
          model: 'gemini-2.0-flash',
          systemInstruction: FEMALE_HEALTH_TRIAGE_SYSTEM_PROMPT,
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
        })
        try {
          result = await fallbackModel.generateContent(userPrompt)
        } catch (fallbackError) {
          console.error('Gemini fallback model also failed:', fallbackError)
          throw fallbackError
        }
      } else {
        console.error('Gemini API call failed:', apiError)
        throw apiError
      }
    }

    const response = result.response
    let text = response.text()
    console.log('Gemini raw response:', text.slice(0, 500))

    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      text = jsonMatch[1].trim()
    }

    try {
      const parsed = JSON.parse(text) as DiagnosisResult

      // Ensure all required fields are present
      return {
        urgencyLevel: parsed.urgencyLevel || 'MODERATE',
        urgencyReason: parsed.urgencyReason || 'Unable to determine urgency',
        primaryAssessment: parsed.primaryAssessment || 'Assessment pending',
        differentialConsiderations: parsed.differentialConsiderations || [],
        redFlags: parsed.redFlags || [],
        recommendations: parsed.recommendations || ['Consult with a healthcare provider'],
        questionsForDoctor: parsed.questionsForDoctor || [],
        specialtyReferral: parsed.specialtyReferral,
        disclaimer: parsed.disclaimer || 'This is a preliminary triage assessment, not a medical diagnosis. Always consult with a qualified healthcare provider.',
      }
    } catch {
      console.error('Failed to parse Gemini response:', text)
      return {
        urgencyLevel: 'MODERATE',
        urgencyReason: 'Unable to complete full analysis',
        primaryAssessment: 'The AI was unable to provide a complete assessment. Please consult with a healthcare provider.',
        differentialConsiderations: [],
        redFlags: [],
        recommendations: ['Consult with a healthcare provider for proper evaluation'],
        disclaimer: 'This is a preliminary triage assessment, not a medical diagnosis. Always consult with a qualified healthcare provider.',
      }
    }
  }

  async chatWithHera(context: any, message: string): Promise<string> {
    const chatModels = [this.modelId, 'gemini-2.0-flash', 'gemini-1.5-flash']

    for (const modelName of chatModels) {
      try {
        console.log(`[Gemini Chat] Trying model: ${modelName}`)
        const model = this.client.getGenerativeModel({
          model: modelName,
          systemInstruction: FEMALE_HEALTH_CHAT_SYSTEM_PROMPT,
        })

        const chat = model.startChat({
          history: [
            {
              role: 'user',
              parts: [{ text: `Here is my health context:\n${JSON.stringify(context, null, 2)}` }],
            },
            {
              role: 'model',
              parts: [{ text: "Thank you. I have reviewed your health data. How can I help you today?" }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1000,
          },
        })

        const result = await chat.sendMessage(message)
        const response = await result.response
        return response.text()
      } catch (err: any) {
        console.warn(`[Gemini Chat] Model ${modelName} failed:`, err?.message || err)
        // If it's the last model, throw
        if (modelName === chatModels[chatModels.length - 1]) {
          throw err
        }
        // Wait 3s before trying next model (quota cooldown)
        console.log('[Gemini Chat] Waiting 3s before trying next model...')
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    }

    throw new Error('All Gemini models failed')
  }
}

let geminiService: GeminiService | null = null

export function getGeminiService(): GeminiService {
  if (!geminiService) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY not configured! Please add your API key to .env file')
    }
    console.log('Initializing Gemini service with API key:', apiKey.slice(0, 8) + '...')
    geminiService = new GeminiService(apiKey)
  }
  return geminiService
}
