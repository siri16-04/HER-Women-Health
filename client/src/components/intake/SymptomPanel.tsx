import { useState, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import type { BodyPart } from '../../types'
import Button from '../common/Button'

const bodyPartLabels: Record<BodyPart, string> = {
  head: 'Head',
  thyroid: 'Thyroid/Neck',
  chest: 'Chest',
  breast: 'Breast',
  abdomen: 'Abdomen',
  pelvic: 'Pelvic',
  back: 'Back',
  extremities: 'Arms & Legs',
}

export default function SymptomPanel() {
  const {
    selectedBodyParts,
    symptoms,
    addSymptom,
    removeSymptom,
    currentMedications,
    addMedication,
    removeMedication,
    additionalNotes,
    setAdditionalNotes
  } = useApp()

  const [currentPart, setCurrentPart] = useState<BodyPart | null>(null)
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState(5)
  const [medicationInput, setMedicationInput] = useState('')

  // Voice input state
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const handleStartVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      chunksRef.current = []
      const recorder = new MediaRecorder(stream, { mimeType })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: mimeType })

        if (blob.size < 1000) return // too short

        setIsTranscribing(true)
        try {
          const resp = await fetch('/api/voice/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': mimeType },
            body: blob,
          })
          if (resp.ok) {
            const { text } = await resp.json()
            if (text) {
              setDescription(
                description ? `${description} ${text}` : text
              )
            }
          }
        } catch (err) {
          console.error('Transcription failed:', err)
        } finally {
          setIsTranscribing(false)
        }
      }

      recorder.start(500)
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone access denied:', err)
    }
  }

  const handleStopVoice = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }

  const handleAddSymptom = () => {
    if (currentPart && description.trim()) {
      addSymptom({
        bodyPart: currentPart,
        description: description.trim(),
        severity,
      })
      setDescription('')
      setSeverity(5)
      setCurrentPart(null)
    }
  }

  const handleAddMedication = () => {
    if (medicationInput.trim()) {
      addMedication(medicationInput.trim())
      setMedicationInput('')
    }
  }

  const handleMedicationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddMedication()
    }
  }

  if (selectedBodyParts.length === 0) {
    return (
      <p className="text-sm text-neutral-500 italic">
        Select body areas on the map to add symptoms
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Symptom form */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Body Area
          </label>
          <select
            value={currentPart || ''}
            onChange={(e) => setCurrentPart(e.target.value as BodyPart)}
            className="input"
          >
            <option value="">Select area...</option>
            {selectedBodyParts.map((part) => (
              <option key={part} value={part}>
                {bodyPartLabels[part]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-neutral-700">
              Describe your symptom
            </label>
            <button
              onClick={isRecording ? handleStopVoice : handleStartVoice}
              disabled={isTranscribing}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                transition-all duration-300
                ${isRecording
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 animate-pulse'
                  : isTranscribing
                    ? 'bg-neutral-100 text-neutral-400 cursor-wait'
                    : 'bg-healing-100 text-healing-700 hover:bg-healing-200 hover:shadow-sm'
                }
              `}
              title={isRecording ? 'Stop recording' : 'Speak your symptom'}
            >
              {isTranscribing ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="10" />
                  </svg>
                  Transcribing...
                </>
              ) : isRecording ? (
                <>
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-sm" />
                  Stop
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z" />
                  </svg>
                  Voice
                </>
              )}
            </button>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tap Voice to speak, or type your symptom..."
            className="input min-h-[80px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Severity (1-10): {severity}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="w-full accent-healing-600"
          />
          <div className="flex justify-between text-xs text-neutral-400">
            <span>Mild</span>
            <span>Severe</span>
          </div>
        </div>

        <Button
          onClick={handleAddSymptom}
          disabled={!currentPart || !description.trim()}
          size="sm"
          className="w-full"
        >
          Add Symptom
        </Button>
      </div>

      {/* Symptom list */}
      {symptoms.length > 0 && (
        <div className="border-t border-neutral-200 pt-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-2">
            Reported Symptoms
          </h3>
          <ul className="space-y-2">
            {symptoms.map((symptom) => (
              <li
                key={symptom.id}
                className="flex items-start justify-between bg-neutral-50 rounded-lg p-3"
              >
                <div>
                  <span className="text-xs font-medium text-healing-700 uppercase">
                    {bodyPartLabels[symptom.bodyPart]}
                  </span>
                  <p className="text-sm text-neutral-800">{symptom.description}</p>
                  <span className="text-xs text-neutral-500">
                    Severity: {symptom.severity}/10
                  </span>
                </div>
                <button
                  onClick={() => removeSymptom(symptom.id)}
                  className="text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Current Medications */}
      <div className="border-t border-neutral-200 pt-4">
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Current Medications
        </label>
        <p className="text-xs text-neutral-500 mb-2">
          List any medications, supplements, or birth control you're currently taking
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={medicationInput}
            onChange={(e) => setMedicationInput(e.target.value)}
            onKeyDown={handleMedicationKeyDown}
            placeholder="e.g., Ibuprofen, Birth control..."
            className="input flex-1"
          />
          <Button
            onClick={handleAddMedication}
            disabled={!medicationInput.trim()}
            size="sm"
          >
            Add
          </Button>
        </div>

        {/* Medication tags */}
        {currentMedications.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {currentMedications.map((med) => (
              <span
                key={med}
                className="inline-flex items-center gap-1 px-3 py-1 bg-healing-100 text-healing-800 rounded-full text-sm"
              >
                {med}
                <button
                  onClick={() => removeMedication(med)}
                  className="text-healing-600 hover:text-red-500 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Additional notes */}
      <div className="border-t border-neutral-200 pt-4">
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Additional Notes (optional)
        </label>
        <textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="Any other information you'd like to share..."
          className="input min-h-[60px]"
        />
      </div>
    </div>
  )
}

