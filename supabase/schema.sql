-- HER Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
-- Extends the built-in auth.users table with additional profile data

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  age INTEGER,
  height NUMERIC(5,2), -- stored in cm
  weight NUMERIC(5,2), -- stored in kg
  blood_group TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, age, height, weight, blood_group)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    (NEW.raw_user_meta_data->>'age')::INTEGER,
    (NEW.raw_user_meta_data->>'height')::NUMERIC,
    (NEW.raw_user_meta_data->>'weight')::NUMERIC,
    NEW.raw_user_meta_data->>'blood_group'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- 2. SESSIONS TABLE
-- ============================================
-- Diagnostic sessions with intake data

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  life_stage TEXT NOT NULL,
  selected_body_parts TEXT[] NOT NULL,
  additional_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions
CREATE POLICY "Users can view their own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions(created_at DESC);


-- ============================================
-- 3. SYMPTOMS TABLE
-- ============================================
-- Symptoms associated with each session

CREATE TABLE IF NOT EXISTS public.symptoms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  body_part TEXT NOT NULL,
  description TEXT NOT NULL,
  severity INTEGER CHECK (severity >= 1 AND severity <= 10) NOT NULL,
  duration TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for symptoms (inherit from session ownership)
CREATE POLICY "Users can view symptoms of their own sessions"
  ON public.symptoms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = symptoms.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create symptoms for their own sessions"
  ON public.symptoms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = symptoms.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update symptoms of their own sessions"
  ON public.symptoms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = symptoms.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete symptoms of their own sessions"
  ON public.symptoms FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = symptoms.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_symptoms_session_id ON public.symptoms(session_id);


-- ============================================
-- 4. BIOMETRIC SUMMARIES TABLE
-- ============================================
-- BPM/HRV summary per session

CREATE TABLE IF NOT EXISTS public.biometric_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  avg_bpm NUMERIC(5,2) NOT NULL,
  avg_hrv NUMERIC(5,2) NOT NULL,
  min_bpm NUMERIC(5,2),
  max_bpm NUMERIC(5,2),
  scan_duration INTEGER, -- in seconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.biometric_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for biometric_summaries (inherit from session ownership)
CREATE POLICY "Users can view biometrics of their own sessions"
  ON public.biometric_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = biometric_summaries.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create biometrics for their own sessions"
  ON public.biometric_summaries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = biometric_summaries.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update biometrics of their own sessions"
  ON public.biometric_summaries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = biometric_summaries.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_biometric_summaries_session_id ON public.biometric_summaries(session_id);


-- ============================================
-- 5. DIAGNOSIS RESULTS TABLE
-- ============================================
-- AI triage results per session

CREATE TABLE IF NOT EXISTS public.diagnosis_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  urgency_level TEXT CHECK (urgency_level IN ('EMERGENCY', 'URGENT', 'MODERATE', 'LOW')) NOT NULL,
  urgency_reason TEXT,
  primary_assessment TEXT NOT NULL,
  recommendations TEXT[],
  red_flags TEXT[],
  differential_considerations TEXT[],
  specialty_referral TEXT,
  questions_for_doctor TEXT[],
  disclaimer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.diagnosis_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for diagnosis_results (inherit from session ownership)
CREATE POLICY "Users can view diagnoses of their own sessions"
  ON public.diagnosis_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = diagnosis_results.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create diagnoses for their own sessions"
  ON public.diagnosis_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = diagnosis_results.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update diagnoses of their own sessions"
  ON public.diagnosis_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = diagnosis_results.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_diagnosis_results_session_id ON public.diagnosis_results(session_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_results_urgency ON public.diagnosis_results(urgency_level);


-- ============================================
-- 6. UPDATED_AT TRIGGER FUNCTION
-- ============================================
-- Auto-update the updated_at column

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================
-- 7. PERIOD LOGS TABLE
-- ============================================
-- Menstrual cycle tracking per user

CREATE TABLE IF NOT EXISTS public.period_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE,
  notes TEXT,
  flow_intensity TEXT CHECK (flow_intensity IN ('Light', 'Medium', 'Heavy', 'Spotting')),
  symptoms TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.period_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for period_logs
CREATE POLICY "Users can view their own period logs"
  ON public.period_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own period logs"
  ON public.period_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own period logs"
  ON public.period_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own period logs"
  ON public.period_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_period_logs_user_id ON public.period_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_period_logs_period_start ON public.period_logs(period_start DESC);


-- ============================================
-- 8. WELLNESS LOGS TABLE
-- ============================================
-- Daily wellness tracking: mood, energy, sleep, hydration

CREATE TABLE IF NOT EXISTS public.wellness_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  energy INTEGER CHECK (energy >= 1 AND energy <= 5),
  sleep_hours NUMERIC(3,1),
  hydration INTEGER CHECK (hydration >= 0 AND hydration <= 15),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

ALTER TABLE public.wellness_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wellness logs"
  ON public.wellness_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own wellness logs"
  ON public.wellness_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own wellness logs"
  ON public.wellness_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own wellness logs"
  ON public.wellness_logs FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wellness_logs_user_date ON public.wellness_logs(user_id, log_date DESC);


-- ============================================
-- 9. EMERGENCY CONTACTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own emergency contacts"
  ON public.emergency_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own emergency contacts"
  ON public.emergency_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own emergency contacts"
  ON public.emergency_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own emergency contacts"
  ON public.emergency_contacts FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- GRANT PERMISSIONS
-- ============================================
-- Allow authenticated users to access these tables

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.sessions TO authenticated;
GRANT ALL ON public.symptoms TO authenticated;
GRANT ALL ON public.biometric_summaries TO authenticated;
GRANT ALL ON public.diagnosis_results TO authenticated;
GRANT ALL ON public.period_logs TO authenticated;
GRANT ALL ON public.wellness_logs TO authenticated;
GRANT ALL ON public.emergency_contacts TO authenticated;
