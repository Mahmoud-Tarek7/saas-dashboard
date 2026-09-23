-- ============================================
-- Migration: Phase 5 - Teachers Module
-- Additive only — no data deletion, no existing table rewrites
-- ============================================

-- 1. Create Teachers Table
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  specialization TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Index for active teachers lookup
CREATE INDEX IF NOT EXISTS teachers_is_active_idx ON public.teachers (is_active);

-- 3. Row Level Security (RLS) for Teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users full access on teachers" ON public.teachers;
CREATE POLICY "authenticated users full access on teachers"
  ON public.teachers FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 4. Connect halaqat to teachers (nullable foreign key with ON DELETE SET NULL)
-- NOTE: teacher_name is explicitly kept as a legacy compatibility fallback.
ALTER TABLE public.halaqat
  ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL;

-- 5. Index for halaqat teacher foreign key
CREATE INDEX IF NOT EXISTS halaqat_teacher_id_idx ON public.halaqat (teacher_id);
