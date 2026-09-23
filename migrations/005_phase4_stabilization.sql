-- ============================================
-- Migration: Phase 4 - P0 Stabilization
-- Activity Log + Subscriptions Integrity
-- ============================================

-- NOTE: activity_log table already exists from migration 002.
-- This migration only adds the subscription duplicate prevention constraint.

-- ============================================
-- SUBSCRIPTIONS INTEGRITY
-- ============================================

-- Prevent duplicate subscription records for the same student + month
-- This ensures each student can only have ONE subscription record per month
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_student_month_unique_idx
  ON subscriptions (student_id, month);

-- Index to speed up subscription queries by month
CREATE INDEX IF NOT EXISTS subscriptions_month_idx
  ON subscriptions (month);

-- Index to speed up subscription queries by student
CREATE INDEX IF NOT EXISTS subscriptions_student_id_idx
  ON subscriptions (student_id);
