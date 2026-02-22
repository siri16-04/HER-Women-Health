import { supabase } from '../lib/supabase'
import type { Symptom, BiometricSummary, DiagnosisResult } from '../types'

// Session API
export const sessionsApi = {
  create: async (data: {
    lifeStage: string
    selectedBodyParts: string[]
    additionalNotes?: string
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        life_stage: data.lifeStage,
        selected_body_parts: data.selectedBodyParts,
        additional_notes: data.additionalNotes || null,
      })
      .select()
      .single()

    if (error) throw error
    return session
  },

  getAll: async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        symptoms (*),
        biometric_summaries (*),
        diagnosis_results (*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        symptoms (*),
        biometric_summaries (*),
        diagnosis_results (*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },
}

// Symptoms API
export const symptomsApi = {
  createBatch: async (sessionId: string, symptoms: Symptom[]) => {
    if (symptoms.length === 0) return

    const { error } = await supabase
      .from('symptoms')
      .insert(
        symptoms.map((s) => ({
          session_id: sessionId,
          body_part: s.bodyPart,
          description: s.description,
          severity: s.severity,
          duration: s.duration || null,
        }))
      )

    if (error) throw error
  },
}

// Biometrics API
export const biometricsApi = {
  saveSummary: async (sessionId: string, summary: BiometricSummary) => {
    const { error } = await supabase
      .from('biometric_summaries')
      .insert({
        session_id: sessionId,
        avg_bpm: summary.avgBpm,
        avg_hrv: summary.avgHrv,
        min_bpm: summary.minBpm,
        max_bpm: summary.maxBpm,
        scan_duration: summary.scanDuration,
      })

    if (error) throw error
  },
}

// Diagnosis API
export const diagnosisApi = {
  save: async (sessionId: string, result: DiagnosisResult) => {
    const { error } = await supabase
      .from('diagnosis_results')
      .insert({
        session_id: sessionId,
        urgency_level: result.urgencyLevel,
        urgency_reason: result.urgencyReason,
        primary_assessment: result.primaryAssessment,
        recommendations: result.recommendations,
        red_flags: result.redFlags || [],
        differential_considerations: result.differentialConsiderations || [],
        specialty_referral: result.specialtyReferral || null,
        disclaimer: result.disclaimer || null,
        questions_for_doctor: result.questionsForDoctor || [],
      })

    if (error) throw error
  },
}

// Analytics API for charts
export const analyticsApi = {
  getBiometricTrends: async (limit = 10) => {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id,
        created_at,
        biometric_summaries (avg_bpm, avg_hrv)
      `)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) throw error
    return data
  },

  getUrgencyDistribution: async () => {
    const { data, error } = await supabase
      .from('diagnosis_results')
      .select('urgency_level')

    if (error) throw error
    return data
  },
}

// Period Tracking API
export const periodApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('period_logs')
      .select('*')
      .order('period_start', { ascending: false })

    if (error) throw error
    return data || []
  },

  logPeriod: async (startDate: string, endDate?: string, notes?: string, flow?: string, symptoms?: string[]) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('period_logs')
      .insert({
        user_id: user.id,
        period_start: startDate,
        period_end: endDate,
        notes,
        flow_intensity: flow,
        symptoms
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  updateLog: async (id: string, updates: { period_end?: string; notes?: string; cycle_length?: number; flow_intensity?: string; symptoms?: string[] }) => {
    const { data, error } = await supabase
      .from('period_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  deleteLog: async (id: string) => {
    const { error } = await supabase
      .from('period_logs')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data
  }
}

// Wellness Journal API
export const wellnessApi = {
  getAll: async (limit = 30) => {
    const { data, error } = await supabase
      .from('wellness_logs')
      .select('*')
      .order('log_date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  getToday: async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('wellness_logs')
      .select('*')
      .eq('log_date', today)
      .maybeSingle()

    if (error) throw error
    return data
  },

  upsert: async (entry: {
    log_date: string
    mood?: number
    energy?: number
    sleep_hours?: number
    hydration?: number
    notes?: string
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('wellness_logs')
      .upsert({
        user_id: user.id,
        ...entry,
      }, { onConflict: 'user_id,log_date' })
      .select()
      .single()

    if (error) throw error
    return data
  },

  deleteEntry: async (id: string) => {
    const { error } = await supabase
      .from('wellness_logs')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

// Emergency Contacts API
export const emergencyContactsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  add: async (contact: { name: string; phone: string; relationship?: string }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert({ user_id: user.id, ...contact })
      .select()
      .single()

    if (error) throw error
    return data
  },

  remove: async (id: string) => {
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
