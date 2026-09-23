-- ============================================
-- هجرة قاعدة البيانات: المرحلة الثانية (Sprint 2)
-- إدارة متابعة القرآن الكريم: التسميع اليومي، المراجعة الدورية، والاختبارات
-- Quran Center Management System - Sprint 2 Migration
-- ============================================

-- تفعيل ملحق توليد المعرفات الفريدة إن لم يكن مفعلاً
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. جدول سجلات التسميع والحفظ الجديد (memorization_records)
-- ============================================
CREATE TABLE IF NOT EXISTS memorization_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  halaqa_id UUID NOT NULL REFERENCES halaqat(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES auth.users(id),
  teacher_name TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_type TEXT NOT NULL DEFAULT 'new' CHECK (session_type IN ('new', 'review')),
  surah_number INTEGER NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  surah_name TEXT NOT NULL,
  from_ayah INTEGER NOT NULL CHECK (from_ayah >= 1),
  to_ayah INTEGER NOT NULL CHECK (to_ayah >= 1),
  lines_count NUMERIC,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  tajweed_score INTEGER CHECK (tajweed_score BETWEEN 1 AND 5),
  errors_count INTEGER DEFAULT 0,
  error_types TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_ayah_range CHECK (to_ayah >= from_ayah)
);

-- ============================================
-- 2. جدول سجلات المراجعة وتثبيت المحفوظ (revision_records)
-- ============================================
CREATE TABLE IF NOT EXISTS revision_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  halaqa_id UUID NOT NULL REFERENCES halaqat(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES auth.users(id),
  teacher_name TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  surah_number INTEGER NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  surah_name TEXT NOT NULL,
  from_ayah INTEGER NOT NULL CHECK (from_ayah >= 1),
  to_ayah INTEGER NOT NULL CHECK (to_ayah >= 1),
  pages_count NUMERIC,
  mastery_level INTEGER NOT NULL CHECK (mastery_level BETWEEN 1 AND 5),
  errors_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_revision_ayah_range CHECK (to_ayah >= from_ayah)
);

-- ============================================
-- 3. جدول الاختبارات الدورية وتقييمات الإتقان (exams)
-- ============================================
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  halaqa_id UUID REFERENCES halaqat(id) ON DELETE SET NULL,
  examiner_name TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  exam_name TEXT NOT NULL,
  surah_from INTEGER NOT NULL CHECK (surah_from BETWEEN 1 AND 114),
  surah_to INTEGER NOT NULL CHECK (surah_to BETWEEN 1 AND 114),
  hifz_score INTEGER CHECK (hifz_score BETWEEN 0 AND 100),
  tajweed_score INTEGER CHECK (tajweed_score BETWEEN 0 AND 100),
  performance_score INTEGER CHECK (performance_score BETWEEN 0 AND 100),
  total_score INTEGER CHECK (total_score BETWEEN 0 AND 100),
  grade TEXT,
  errors_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. دالة ومحفز حساب الدرجة والتقدير التلقائي للاختبارات
-- ============================================
CREATE OR REPLACE FUNCTION calculate_exam_grade()
RETURNS TRIGGER AS $$
BEGIN
  -- حساب المجموع الكلي: 50% حفظ + 30% تجويد + 20% أداء وحسن تلاوة
  IF NEW.hifz_score IS NOT NULL OR NEW.tajweed_score IS NOT NULL OR NEW.performance_score IS NOT NULL THEN
    NEW.total_score := ROUND(
      COALESCE(NEW.hifz_score, 0) * 0.5 +
      COALESCE(NEW.tajweed_score, 0) * 0.3 +
      COALESCE(NEW.performance_score, 0) * 0.2
    );
  END IF;
  
  -- تحديد التقدير العام بناءً على المجموع الكلي
  IF NEW.total_score IS NOT NULL THEN
    NEW.grade := CASE
      WHEN NEW.total_score >= 90 THEN 'ممتاز'
      WHEN NEW.total_score >= 80 THEN 'جيد جدًا'
      WHEN NEW.total_score >= 70 THEN 'جيد'
      WHEN NEW.total_score >= 60 THEN 'مقبول'
      ELSE 'ضعيف'
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS exam_grade_trigger ON exams;
CREATE TRIGGER exam_grade_trigger
  BEFORE INSERT OR UPDATE ON exams
  FOR EACH ROW
  EXECUTE FUNCTION calculate_exam_grade();

-- ============================================
-- 5. إعدادات وسياسات أمان مستوى الصفوف (RLS)
-- ============================================
-- تفعيل RLS على جميع الجداول الجديدة
ALTER TABLE memorization_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- سياسة الصلاحيات الكاملة للمستخدمين المسجلين (Authenticated Users)
DROP POLICY IF EXISTS "authenticated users full access on memorization_records" ON memorization_records;
CREATE POLICY "authenticated users full access on memorization_records"
ON memorization_records FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "authenticated users full access on revision_records" ON revision_records;
CREATE POLICY "authenticated users full access on revision_records"
ON revision_records FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "authenticated users full access on exams" ON exams;
CREATE POLICY "authenticated users full access on exams"
ON exams FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 6. الفهارس لتسريع الاستعلامات والتقارير (Indexes)
-- ============================================
CREATE INDEX IF NOT EXISTS memorization_records_student_date_idx ON memorization_records (student_id, date DESC);
CREATE INDEX IF NOT EXISTS memorization_records_halaqa_date_idx ON memorization_records (halaqa_id, date DESC);
CREATE INDEX IF NOT EXISTS revision_records_student_date_idx ON revision_records (student_id, date DESC);
CREATE INDEX IF NOT EXISTS revision_records_halaqa_date_idx ON revision_records (halaqa_id, date DESC);
CREATE INDEX IF NOT EXISTS exams_student_date_idx ON exams (student_id, date DESC);
CREATE INDEX IF NOT EXISTS exams_halaqa_idx ON exams (halaqa_id);
