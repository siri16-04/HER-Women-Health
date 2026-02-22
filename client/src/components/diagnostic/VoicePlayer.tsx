import { useEffect, useRef, useCallback, useState } from 'react'
import { useSession } from '../../context/SessionContext'
import type { ScanPhase } from '../../types'

// Set to true to skip voice API calls (for demo without ElevenLabs)
const DEMO_MODE = false

const phaseScripts: Partial<Record<ScanPhase, string>> = {
  welcome: 'Welcome. I am here to guide you through a brief health assessment. Please find a comfortable position and look directly at your camera.',
  positioning: 'Perfect. Now, please keep your face within the guide on screen. Try to remain still and breathe naturally.',
  scanning: 'I am now measuring your vital signs. This will take about thirty seconds. Try to relax your shoulders and take slow, easy breaths.',
  midway: 'You are doing wonderfully. We are about halfway through. Continue breathing naturally.',
  completing: 'Excellent. I am finishing up the measurements now. Just a few more seconds.',
  complete: 'All done. I have collected your vital signs and I am now preparing your personalized health assessment.',
}

export default function VoicePlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const { scanPhase, setAudioPlaying } = useSession()
  const lastPlayedPhaseRef = useRef<ScanPhase | null>(null)
  const [currentText, setCurrentText] = useState<string | null>(null)

  const playVoiceForPhase = useCallback(async (phase: ScanPhase) => {
    const script = phaseScripts[phase]
    if (!script) return

    // In demo mode, just show the text instead of playing audio
    if (DEMO_MODE) {
      setCurrentText(script)
      console.log(`[Voice] ${phase}: ${script}`)
      // Auto-clear text after 5 seconds
      setTimeout(() => setCurrentText(null), 5000)
      return
    }

    if (!audioRef.current) return

    try {
      setAudioPlaying(true)

      const response = await fetch('/api/voice/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: script }),
      })

      if (!response.ok) {
        throw new Error('Voice stream failed')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      audioRef.current.src = audioUrl
      await audioRef.current.play()

      audioRef.current.onended = () => {
        setAudioPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }
    } catch (err) {
      console.error('Voice playback error:', err)
      setAudioPlaying(false)
      // Show text as fallback
      setCurrentText(script)
      setTimeout(() => setCurrentText(null), 5000)
    }
  }, [setAudioPlaying])

  useEffect(() => {
    if (scanPhase !== lastPlayedPhaseRef.current && phaseScripts[scanPhase]) {
      lastPlayedPhaseRef.current = scanPhase
      playVoiceForPhase(scanPhase)
    }
  }, [scanPhase, playVoiceForPhase])

  return (
    <>
      <audio ref={audioRef} className="hidden" />
      {/* Text fallback for demo mode */}
      {currentText && (
        <div className="absolute bottom-32 left-0 right-0 px-6">
          <div className="max-w-md mx-auto bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3">
            <p className="text-white text-center text-sm italic">
              "{currentText}"
            </p>
          </div>
        </div>
      )}
    </>
  )
}
