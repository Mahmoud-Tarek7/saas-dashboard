-- ============================================
-- Migration: Sprint 1 - Dashboard / Students / Halaqat
-- تعديلات إضافية بس - لا تمس أي بيانات موجودة
-- ============================================

-- 1. إضافة "المحفظ" و"الحالة" لجدول الحلقات
alter table halaqat
  add column if not exists teacher_name text,
  add column if not exists is_active boolean not null default true;

-- 2. جدول بسيط لتسجيل النشاطات الأخيرة (قابل للتوسع لاحقًا)
create table if not exists activity_log (
  id uuid primary key default uuid_generate_v4(),
  type text not null, -- 'student_created' | 'student_updated' | 'halaqa_created' | 'attendance_recorded' ...
  description text not null,
  actor_id uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

alter table activity_log enable row level security;

create policy "authenticated users full access on activity_log"
on activity_log for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- فهرس بسيط يسرّع جلب آخر النشاطات
create index if not exists activity_log_created_at_idx on activity_log (created_at desc);
