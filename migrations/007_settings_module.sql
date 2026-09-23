-- ============================================
-- Migration: Phase 6 - Settings Module
-- Singleton center_settings table for single-center application
-- ============================================

-- 1. Create center_settings Table
CREATE TABLE IF NOT EXISTS public.center_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_name TEXT NOT NULL DEFAULT 'مركز تحفيظ القرآن',
  manager_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  default_subscription_amount NUMERIC NOT NULL DEFAULT 100 CHECK (default_subscription_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'EGP',
  is_singleton BOOLEAN NOT NULL DEFAULT true UNIQUE CHECK (is_singleton = true),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Row Level Security (RLS)
ALTER TABLE public.center_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users full access on center_settings" ON public.center_settings;
CREATE POLICY "authenticated users full access on center_settings"
  ON public.center_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 3. Seed Initial Singleton Record
INSERT INTO public.center_settings (
  center_name,
  manager_name,
  phone,
  email,
  address,
  default_subscription_amount,
  currency,
  is_singleton
)
VALUES (
  'مركز تحفيظ القرآن',
  NULL,
  NULL,
  NULL,
  NULL,
  100,
  'EGP',
  true
)
ON CONFLICT (is_singleton) DO NOTHING;
