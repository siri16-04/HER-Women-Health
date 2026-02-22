export type LifeStage =
  | 'menstruating'
  | 'pregnant'
  | 'postpartum'
  | 'perimenopause'
  | 'menopause'
  | 'postmenopause'

export type BodyPart =
  | 'head'
  | 'thyroid'
  | 'chest'
  | 'breast'
  | 'abdomen'
  | 'pelvic'
  | 'back'
  | 'extremities'

export interface Symptom {
  id: string
  bodyPart: BodyPart
  description: string
  severity: number
  duration?: string
}

export interface IntakeData {
  lifeStage: LifeStage
  selectedBodyParts: BodyPart[]
  symptoms: Symptom[]
  currentMedications?: string[]
  additionalNotes?: string
}

export interface BiometricReading {
  bpm: number
  hrv: number
  spo2?: number
  confidence: number
  timestamp: number
}

export interface BiometricSummary {
  avgBpm: number
  avgHrv: number
  minBpm: number
  maxBpm: number
  scanDuration: number
  totalReadings: number
  validReadings: number
  /** Set when using real Presage or fallback mode. */
  source?: 'presage' | 'fallback'
  /** Breathing rate (breaths/min) from Presage SDK when available. */
  breathingRate?: number
  /** Median BPM after outlier removal (enhanced prediction). */
  medianBpm?: number
}

export type UrgencyLevel = 'EMERGENCY' | 'URGENT' | 'MODERATE' | 'LOW'

export interface DiagnosisResult {
  urgencyLevel: UrgencyLevel
  urgencyReason: string
  primaryAssessment: string
  differentialConsiderations: string[]
  redFlags: string[]
  recommendations: string[]
  questionsForDoctor?: string[]
  specialtyReferral?: string
  disclaimer: string
}

export interface Clinic {
  id: string
  name: string
  address: string
  location: { lat: number; lng: number }
  phone?: string
  website?: string
  distance?: number
  tags?: string[]
}
