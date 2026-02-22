-- Run this in your Supabase SQL Editor to add the new fields to your existing period_logs table

-- 1. Add flow_intensity column
ALTER TABLE public.period_logs 
ADD COLUMN IF NOT EXISTS flow_intensity TEXT CHECK (flow_intensity IN ('Light', 'Medium', 'Heavy', 'Spotting'));

-- 2. Add symptoms column
ALTER TABLE public.period_logs 
ADD COLUMN IF NOT EXISTS symptoms TEXT[];

-- 3. Add period_end column if it doesn't exist
ALTER TABLE public.period_logs 
ADD COLUMN IF NOT EXISTS period_end DATE;

-- 4. Add notes column if it doesn't exist
ALTER TABLE public.period_logs 
ADD COLUMN IF NOT EXISTS notes TEXT;
