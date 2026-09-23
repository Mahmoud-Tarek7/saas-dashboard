import { supabase } from "./supabase";
import { logActivity } from "./activityLog";

/**
 * تسجيل مراجعة لطالب
 * Create a revision record
 */
export async function createRevisionRecord({
  student_id,
  halaqa_id,
  teacher_name,
  date,
  surah_number,
  surah_name,
  from_ayah,
  to_ayah,
  pages_count,
  mastery_level,
  errors_count,
  notes,
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("revision_records")
    .insert({
      student_id,
      halaqa_id,
      teacher_name,
      date,
      surah_number,
      surah_name,
      from_ayah,
      to_ayah,
      pages_count: pages_count || null,
      mastery_level,
      errors_count: errors_count || 0,
      notes: notes || null,
      recorded_by: user?.id,
    })
    .select()
    .single();

  if (!error) {
    logActivity("revision_recorded", `تم تسجيل مراجعة لطالب - سورة ${surah_name}`);
  }
  return { data, error };
}

/**
 * جلب سجل المراجعة لطالب محدد
 * Get revision history for a student
 */
export async function getStudentRevisionHistory(studentId, limit = 50) {
  const { data, error } = await supabase
    .from("revision_records")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false })
    .limit(limit);
  return { data, error };
}

/**
 * جلب آخر مراجعة لطالب
 * Get latest revision record for a student
 */
export async function getLatestRevision(studentId) {
  const { data, error } = await supabase
    .from("revision_records")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false })
    .limit(1)
    .single();
  return { data, error };
}

/**
 * جلب جميع سجلات المراجعة لحلقة محددة
 * Get all revision records for a halaqa
 */
export async function getHalaqaRevisionRecords(halaqaId, limit = 100) {
  const { data, error } = await supabase
    .from("revision_records")
    .select("*, students(name)")
    .eq("halaqa_id", halaqaId)
    .order("date", { ascending: false })
    .limit(limit);
  return { data, error };
}

/**
 * جلب مواضع الضعف لطالب (السور ذات الإتقان المنخفض أقل من 3)
 * Get weak areas for a student (surahs with low mastery < 3)
 */
export async function getWeakAreas(studentId) {
  const { data, error } = await supabase
    .from("revision_records")
    .select("surah_number, surah_name, mastery_level, errors_count")
    .eq("student_id", studentId);

  if (error || !data || data.length === 0) return { weakAreas: [], error };

  // تجميع السجلات حسب السورة وحساب متوسط الإتقان ومجموع الأخطاء
  const surahMap = {};
  data.forEach((r) => {
    if (!surahMap[r.surah_number]) {
      surahMap[r.surah_number] = {
        surah_name: r.surah_name,
        surah_number: r.surah_number,
        levels: [],
        errors: 0,
      };
    }
    surahMap[r.surah_number].levels.push(r.mastery_level);
    surahMap[r.surah_number].errors += r.errors_count || 0;
  });

  const weakAreas = Object.values(surahMap)
    .map((s) => ({
      ...s,
      avgMastery:
        Math.round((s.levels.reduce((a, b) => a + b, 0) / s.levels.length) * 10) / 10,
      totalSessions: s.levels.length,
    }))
    .filter((s) => s.avgMastery < 3)
    .sort((a, b) => a.avgMastery - b.avgMastery);

  return { weakAreas, error: null };
}

/**
 * إحصائيات المراجعة لحلقة محددة (متوسط الإتقان وإجمالي الجلسات)
 * Get revision stats for a halaqa
 */
export async function getHalaqaRevisionStats(halaqaId) {
  const { data, error } = await supabase
    .from("revision_records")
    .select("student_id, mastery_level")
    .eq("halaqa_id", halaqaId);

  if (error || !data || data.length === 0) return { avgMastery: 0, totalSessions: 0, error };

  const avgMastery = data.reduce((sum, r) => sum + r.mastery_level, 0) / data.length;

  return {
    avgMastery: Math.round(avgMastery * 10) / 10,
    totalSessions: data.length,
    error: null,
  };
}
