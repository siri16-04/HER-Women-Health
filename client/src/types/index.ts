// Life stages specific to women's health
export type LifeStage =
  | 'menstruating'
  | 'pregnant'
  | 'postpartum'
  | 'perimenopause'
  | 'menopause'
  | 'postmenopause'

// Clickable body regions on the SVG map
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
  severity: number // 1-10
  duration?: string
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
  breathingRate?: number
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

export type ScanPhase =
  | 'idle'
  | 'welcome'
  | 'positioning'
  | 'scanning'
  | 'midway'
  | 'completing'
  | 'complete'
  | 'analyzing'
