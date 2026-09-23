import { supabase } from "./supabase";
import { logActivity } from "./activityLog";

/**
 * تسجيل اختبار جديد لطالب
 * Create an exam record
 */
export async function createExam({
  student_id,
  halaqa_id,
  examiner_name,
  date,
  exam_name,
  surah_from,
  surah_to,
  hifz_score,
  tajweed_score,
  performance_score,
  errors_count,
  notes,
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("exams")
    .insert({
      student_id,
      halaqa_id: halaqa_id || null,
      examiner_name: examiner_name || null,
      date,
      exam_name,
      surah_from,
      surah_to,
      hifz_score: hifz_score || null,
      tajweed_score: tajweed_score || null,
      performance_score: performance_score || null,
      // يتم حساب total_score و grade تلقائيًا بواسطة الـ Trigger في قاعدة البيانات
      errors_count: errors_count || 0,
      notes: notes || null,
      recorded_by: user?.id,
    })
    .select()
    .single();

  if (!error) {
    logActivity("exam_recorded", `تم تسجيل اختبار: ${exam_name}`);
  }
  return { data, error };
}

/**
 * جلب سجل الاختبارات لطالب محدد
 * Get exam history for a student
 */
export async function getStudentExamHistory(studentId, limit = 50) {
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false })
    .limit(limit);
  return { data, error };
}

/**
 * جلب تفاصيل اختبار محدد مع بيانات الطالب والحلقة
 * Get exam details with student and halaqa info
 */
export async function getExamDetails(examId) {
  const { data, error } = await supabase
    .from("exams")
    .select("*, students(name, halaqa_id), halaqat(name)")
    .eq("id", examId)
    .single();
  return { data, error };
}

/**
 * جلب اختبارات حلقة محددة
 * Get exams for a specific halaqa
 */
export async function getHalaqaExams(halaqaId, limit = 50) {
  const { data, error } = await supabase
    .from("exams")
    .select("*, students(name)")
    .eq("halaqa_id", halaqaId)
    .order("date", { ascending: false })
    .limit(limit);
  return { data, error };
}

/**
 * جلب أحدث الاختبارات (للوحة التحكم)
 * Get recent exams (for dashboard)
 */
export async function getRecentExams(limit = 5) {
  const { data, error } = await supabase
    .from("exams")
    .select("*, students(name), halaqat(name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return { data, error };
}

/**
 * إحصائيات الاختبارات لحلقة محددة (متوسط الدرجات وإجمالي الاختبارات)
 * Get exam stats for a halaqa
 */
export async function getHalaqaExamStats(halaqaId) {
  const { data, error } = await supabase
    .from("exams")
    .select("student_id, total_score")
    .eq("halaqa_id", halaqaId)
    .not("total_score", "is", null);

  if (error || !data || data.length === 0) return { avgScore: 0, totalExams: 0, error };

  const avgScore = data.reduce((sum, e) => sum + e.total_score, 0) / data.length;

  return {
    avgScore: Math.round(avgScore * 10) / 10,
    totalExams: data.length,
    error: null,
  };
}
