import { supabase } from "./supabase";
import { logActivity } from "./activityLog";

/**
 * تسجيل تسميع جديد لطالب
 * Create a memorization/tasmee record
 */
export async function createMemorizationRecord({
  student_id,
  halaqa_id,
  teacher_name,
  date,
  session_type,
  surah_number,
  surah_name,
  from_ayah,
  to_ayah,
  lines_count,
  rating,
  tajweed_score,
  errors_count,
  error_types,
  notes,
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("memorization_records")
    .insert({
      student_id,
      halaqa_id,
      teacher_name,
      date,
      session_type: session_type || "new",
      surah_number,
      surah_name,
      from_ayah,
      to_ayah,
      lines_count: lines_count || null,
      rating,
      tajweed_score: tajweed_score || null,
      errors_count: errors_count || 0,
      error_types: error_types || [],
      notes: notes || null,
      recorded_by: user?.id,
    })
    .select()
    .single();

  if (!error) {
    logActivity("memorization_recorded", `تم تسجيل تسميع لطالب - سورة ${surah_name}`);
  }
  return { data, error };
}

/**
 * جلب سجل التسميع لطالب محدد
 * Get memorization history for a student
 */
export async function getStudentMemorizationHistory(studentId, limit = 50) {
  const { data, error } = await supabase
    .from("memorization_records")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false })
    .limit(limit);
  return { data, error };
}

/**
 * جلب آخر سجل تسميع لطالب
 * Get latest memorization record for a student
 */
export async function getLatestMemorization(studentId) {
  const { data, error } = await supabase
    .from("memorization_records")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false })
    .limit(1)
    .single();
  return { data, error };
}

/**
 * جلب جميع سجلات التسميع لحلقة معينة
 * Get all memorization records for a halaqa
 */
export async function getHalaqaMemorizationRecords(halaqaId, limit = 100) {
  const { data, error } = await supabase
    .from("memorization_records")
    .select("*, students(name)")
    .eq("halaqa_id", halaqaId)
    .order("date", { ascending: false })
    .limit(limit);
  return { data, error };
}

/**
 * جلب أحدث سجلات التسميع (للوحة التحكم)
 * Get recent memorization records (for dashboard)
 */
export async function getRecentMemorizationRecords(limit = 5) {
  const { data, error } = await supabase
    .from("memorization_records")
    .select("*, students(name), halaqat(name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return { data, error };
}

/**
 * إحصائيات التسميع لحلقة محددة (متوسط التقييم، عدد الجلسات، عدد الطلاب الفريدين)
 * Get memorization stats for a halaqa
 */
export async function getHalaqaMemorizationStats(halaqaId) {
  const { data, error } = await supabase
    .from("memorization_records")
    .select("student_id, rating")
    .eq("halaqa_id", halaqaId);

  if (error || !data || data.length === 0) return { avgRating: 0, totalSessions: 0, error };

  const avgRating = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
  const uniqueStudents = new Set(data.map((r) => r.student_id)).size;

  return {
    avgRating: Math.round(avgRating * 10) / 10,
    totalSessions: data.length,
    uniqueStudents,
    error: null,
  };
}
