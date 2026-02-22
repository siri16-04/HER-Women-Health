import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { LifeStage, BodyPart, Symptom, DiagnosisResult, Clinic, BiometricSummary } from '../types'
import { sessionsApi, symptomsApi, biometricsApi, diagnosisApi } from '../services/supabaseApi'

interface AppState {
  lifeStage: LifeStage | null
  selectedBodyParts: BodyPart[]
  symptoms: Symptom[]
  currentMedications: string[]
  additionalNotes: string
  diagnosisResult: DiagnosisResult | null
  clinics: Clinic[]
  userLocation: { lat: number; lng: number } | null
  currentSessionId: string | null
}

interface AppContextValue extends AppState {
  setLifeStage: (stage: LifeStage | null) => void
  toggleBodyPart: (part: BodyPart) => void
  addSymptom: (symptom: Omit<Symptom, 'id'>) => void
  removeSymptom: (id: string) => void
  updateSymptom: (id: string, updates: Partial<Symptom>) => void
  addMedication: (medication: string) => void
  removeMedication: (medication: string) => void
  setAdditionalNotes: (notes: string) => void
  setDiagnosisResult: (result: DiagnosisResult | null) => void
  setClinics: (clinics: Clinic[]) => void
  setUserLocation: (location: { lat: number; lng: number } | null) => void
  resetSession: () => void
  canProceedToScan: boolean
  // Supabase functions
  createSession: () => Promise<string | null>
  saveSessionData: (biometrics: BiometricSummary | null, diagnosis: DiagnosisResult) => Promise<void>
}

const initialState: AppState = {
  lifeStage: null,
  selectedBodyParts: [],
  symptoms: [],
  currentMedications: [],
  additionalNotes: '',
  diagnosisResult: null,
  clinics: [],
  userLocation: null,
  currentSessionId: null,
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState)

  const setLifeStage = useCallback((stage: LifeStage | null) => {
    setState(prev => ({ ...prev, lifeStage: stage }))
  }, [])

  const toggleBodyPart = useCallback((part: BodyPart) => {
    setState(prev => ({
      ...prev,
      selectedBodyParts: prev.selectedBodyParts.includes(part)
        ? prev.selectedBodyParts.filter(p => p !== part)
        : [...prev.selectedBodyParts, part]
    }))
  }, [])

  const addSymptom = useCallback((symptom: Omit<Symptom, 'id'>) => {
    const id = crypto.randomUUID()
    setState(prev => ({
      ...prev,
      symptoms: [...prev.symptoms, { ...symptom, id }]
    }))
  }, [])

  const removeSymptom = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter(s => s.id !== id)
    }))
  }, [])

  const updateSymptom = useCallback((id: string, updates: Partial<Symptom>) => {
    setState(prev => ({
      ...prev,
      symptoms: prev.symptoms.map(s => s.id === id ? { ...s, ...updates } : s)
    }))
  }, [])

  const addMedication = useCallback((medication: string) => {
    const trimmed = medication.trim()
    if (trimmed) {
      setState(prev => ({
        ...prev,
        currentMedications: prev.currentMedications.includes(trimmed)
          ? prev.currentMedications
          : [...prev.currentMedications, trimmed]
      }))
    }
  }, [])

  const removeMedication = useCallback((medication: string) => {
    setState(prev => ({
      ...prev,
      currentMedications: prev.currentMedications.filter(m => m !== medication)
    }))
  }, [])

  const setAdditionalNotes = useCallback((notes: string) => {
    setState(prev => ({ ...prev, additionalNotes: notes }))
  }, [])

  const setDiagnosisResult = useCallback((result: DiagnosisResult | null) => {
    setState(prev => ({ ...prev, diagnosisResult: result }))
  }, [])

  const setClinics = useCallback((clinics: Clinic[]) => {
    setState(prev => ({ ...prev, clinics }))
  }, [])

  const setUserLocation = useCallback((location: { lat: number; lng: number } | null) => {
    setState(prev => ({ ...prev, userLocation: location }))
  }, [])

  const resetSession = useCallback(() => {
    setState(initialState)
  }, [])

  // Create a new session in Supabase
  const createSession = useCallback(async (): Promise<string | null> => {
    if (!state.lifeStage || state.selectedBodyParts.length === 0) {
      console.error('Cannot create session: missing required data')
      return null
    }

    try {
      const session = await sessionsApi.create({
        lifeStage: state.lifeStage,
        selectedBodyParts: state.selectedBodyParts,
        additionalNotes: state.additionalNotes || undefined,
      })

      // Save symptoms if any
      if (state.symptoms.length > 0) {
        await symptomsApi.createBatch(session.id, state.symptoms)
      }

      setState(prev => ({ ...prev, currentSessionId: session.id }))
      console.log('Session created:', session.id)
      return session.id
    } catch (error) {
      console.error('Failed to create session:', error)
      return null
    }
  }, [state.lifeStage, state.selectedBodyParts, state.additionalNotes, state.symptoms])

  // Save biometrics and diagnosis to the current session
  const saveSessionData = useCallback(async (
    biometrics: BiometricSummary | null,
    diagnosis: DiagnosisResult
  ): Promise<void> => {
    const sessionId = state.currentSessionId
    if (!sessionId) {
      console.error('No current session to save data to')
      return
    }

    try {
      // Save biometrics if available
      if (biometrics && biometrics.avgBpm > 0) {
        await biometricsApi.saveSummary(sessionId, biometrics)
      }

      // Save diagnosis
      await diagnosisApi.save(sessionId, diagnosis)
      console.log('Session data saved successfully')
    } catch (error) {
      console.error('Failed to save session data:', error)
    }
  }, [state.currentSessionId])

  const canProceedToScan = state.lifeStage !== null && state.selectedBodyParts.length > 0

  return (
    <AppContext.Provider
      value={{
        ...state,
        setLifeStage,
        toggleBodyPart,
        addSymptom,
        removeSymptom,
        updateSymptom,
        addMedication,
        removeMedication,
        setAdditionalNotes,
        setDiagnosisResult,
        setClinics,
        setUserLocation,
        resetSession,
        canProceedToScan,
        createSession,
        saveSessionData,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
