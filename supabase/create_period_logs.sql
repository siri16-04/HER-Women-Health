-- Run this in your Supabase SQL Editor to verify/create the table

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

-- Enable Row Level Security (RLS)
ALTER TABLE public.period_logs ENABLE ROW LEVEL SECURITY;

-- Policies to allow users to manage their own data
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_period_logs_user_id ON public.period_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_period_logs_period_start ON public.period_logs(period_start DESC);
