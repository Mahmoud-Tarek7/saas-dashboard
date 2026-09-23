-- ============================================
-- Migration: Phase 3 - Guardians + Communications
-- Additive only — no data deletion, no existing table rewrites
-- ============================================

-- 1. Guardians
CREATE TABLE IF NOT EXISTS public.guardians (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  secondary_phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guardians_phone_idx ON public.guardians (phone);
CREATE INDEX IF NOT EXISTS guardians_name_idx ON public.guardians (name);
CREATE INDEX IF NOT EXISTS guardians_is_active_idx ON public.guardians (is_active);

-- Soft duplicate prevention on non-empty phones
CREATE UNIQUE INDEX IF NOT EXISTS guardians_phone_unique_idx
  ON public.guardians (phone)
  WHERE phone IS NOT NULL AND btrim(phone) <> '';

ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users full access on guardians" ON public.guardians;
CREATE POLICY "authenticated users full access on guardians"
  ON public.guardians FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 2. Guardian ↔ Student links
CREATE TABLE IF NOT EXISTS public.guardian_students (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'parent',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (guardian_id, student_id)
);

CREATE INDEX IF NOT EXISTS guardian_students_guardian_id_idx ON public.guardian_students (guardian_id);
CREATE INDEX IF NOT EXISTS guardian_students_student_id_idx ON public.guardian_students (student_id);

-- At most one primary guardian per student
CREATE UNIQUE INDEX IF NOT EXISTS guardian_students_one_primary_idx
  ON public.guardian_students (student_id)
  WHERE is_primary = true;

ALTER TABLE public.guardian_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users full access on guardian_students" ON public.guardian_students;
CREATE POLICY "authenticated users full access on guardian_students"
  ON public.guardian_students FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 3. Message templates
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS message_templates_category_idx ON public.message_templates (category);
CREATE INDEX IF NOT EXISTS message_templates_is_active_idx ON public.message_templates (is_active);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users full access on message_templates" ON public.message_templates;
CREATE POLICY "authenticated users full access on message_templates"
  ON public.message_templates FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 4. Communication messages (history + future provider hooks)
CREATE TABLE IF NOT EXISTS public.communication_messages (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in_app'
    CHECK (channel = ANY (ARRAY['in_app'::text, 'sms'::text, 'whatsapp'::text, 'email'::text])),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status = ANY (ARRAY[
      'draft'::text,
      'queued'::text,
      'stored'::text,
      'provider_unavailable'::text,
      'failed'::text
    ])),
  segment_type TEXT NOT NULL DEFAULT 'manual',
  segment_meta JSONB DEFAULT '{}'::jsonb,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS communication_messages_created_at_idx
  ON public.communication_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS communication_messages_status_idx
  ON public.communication_messages (status);
CREATE INDEX IF NOT EXISTS communication_messages_channel_idx
  ON public.communication_messages (channel);

ALTER TABLE public.communication_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users full access on communication_messages" ON public.communication_messages;
CREATE POLICY "authenticated users full access on communication_messages"
  ON public.communication_messages FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5. Per-recipient delivery records
CREATE TABLE IF NOT EXISTS public.communication_recipients (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.communication_messages(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  rendered_title TEXT,
  rendered_body TEXT,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status = ANY (ARRAY[
      'queued'::text,
      'stored'::text,
      'provider_unavailable'::text,
      'failed'::text
    ])),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS communication_recipients_message_id_idx
  ON public.communication_recipients (message_id);
CREATE INDEX IF NOT EXISTS communication_recipients_guardian_id_idx
  ON public.communication_recipients (guardian_id);

ALTER TABLE public.communication_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users full access on communication_recipients" ON public.communication_recipients;
CREATE POLICY "authenticated users full access on communication_recipients"
  ON public.communication_recipients FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Seed a few useful templates (idempotent by name)
INSERT INTO public.message_templates (name, title, body, category)
SELECT v.name, v.title, v.body, v.category
FROM (VALUES
  ('غياب طالب', 'إشعار غياب', E'السلام عليكم {guardian_name}،\nنود إبلاغكم أن الطالب {student_name} لم يحضر حلقة {halaqa_name} اليوم.', 'attendance'),
  ('تقييم الحفظ', 'تحديث التسميع', E'السلام عليكم {guardian_name}،\nتم تسجيل تسميع للطالب {student_name} في حلقة {halaqa_name}.', 'memorization'),
  ('نتيجة اختبار', 'نتيجة اختبار', E'السلام عليكم {guardian_name}،\nنود مشاركتكم نتيجة اختبار الطالب {student_name}.', 'exams'),
  ('تذكير بالاشتراك', 'تذكير بالاشتراك', E'السلام عليكم {guardian_name}،\nنود تذكيركم باشتراك الطالب {student_name} لهذا الشهر.', 'subscriptions'),
  ('إعلان عام', 'إعلان من المركز', E'السلام عليكم {guardian_name}،\nلديكم إعلان هام من مركز التحفيظ.', 'general'),
  ('اجتماع أولياء الأمور', 'دعوة لاجتماع', E'السلام عليكم {guardian_name}،\nنود دعوتكم لحضور اجتماع أولياء الأمور.', 'meetings')
) AS v(name, title, body, category)
WHERE NOT EXISTS (
  SELECT 1 FROM public.message_templates t WHERE t.name = v.name
);
