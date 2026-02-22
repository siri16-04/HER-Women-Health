// ElevenLabs voice service for calming therapeutic voice-over

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'
const CALMING_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // "Sarah" - soothing female voice

export interface VoiceSettings {
  stability: number
  similarity_boost: number
  style?: number
  use_speaker_boost?: boolean
}

const defaultSettings: VoiceSettings = {
  stability: 0.75,
  similarity_boost: 0.8,
  use_speaker_boost: true,
}

export class ElevenLabsService {
  private apiKey: string
  private voiceId: string

  constructor(apiKey: string, voiceId?: string) {
    this.apiKey = apiKey
    this.voiceId = voiceId || CALMING_VOICE_ID
  }

  async generateSpeech(
    text: string,
    settings: Partial<VoiceSettings> = {}
  ): Promise<Buffer> {
    const mergedSettings = { ...defaultSettings, ...settings }

    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${this.voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: mergedSettings,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ElevenLabs API error: ${response.status} - ${error}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  async streamSpeech(
    text: string,
    settings: Partial<VoiceSettings> = {}
  ): Promise<ReadableStream<Uint8Array>> {
    const mergedSettings = { ...defaultSettings, ...settings }

    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${this.voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: mergedSettings,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ElevenLabs API error: ${response.status} - ${error}`)
    }

    return response.body as ReadableStream<Uint8Array>
  }

  /** Speech-to-text: transcribe audio buffer using ElevenLabs Scribe. */
  async transcribe(audioBuffer: Buffer, mimeType = 'audio/webm'): Promise<string> {
    const form = new FormData()
    form.append('model_id', 'scribe_v2')
    form.append('file', new Blob([audioBuffer], { type: mimeType }), 'recording.webm')

    const response = await fetch(`${ELEVENLABS_API_URL}/speech-to-text`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
      },
      body: form,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ElevenLabs STT error: ${response.status} - ${error}`)
    }

    const data = (await response.json()) as { text?: string }
    return (data.text ?? '').trim()
  }
}

let elevenLabsService: ElevenLabsService | null = null

export function getElevenLabsService(): ElevenLabsService {
  if (!elevenLabsService) {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY environment variable is required')
    }
    elevenLabsService = new ElevenLabsService(apiKey)
  }
  return elevenLabsService
}

// Pre-defined scripts for different scan phases
export const scanScripts = {
  welcome: 'Welcome. I am here to guide you through a brief health assessment. Please find a comfortable position and look directly at your camera.',
  positioning: 'Perfect. Now, please keep your face within the guide on screen. Try to remain still and breathe naturally.',
  scanning: 'I am now measuring your vital signs. This will take about thirty seconds. Try to relax your shoulders and take slow, easy breaths.',
  midway: 'You are doing wonderfully. We are about halfway through. Continue breathing naturally.',
  completing: 'Excellent. I am finishing up the measurements now. Just a few more seconds.',
  complete: 'All done. I have collected your vital signs and I am now preparing your personalized health assessment.',
} as const

export type ScanPhase = keyof typeof scanScripts
