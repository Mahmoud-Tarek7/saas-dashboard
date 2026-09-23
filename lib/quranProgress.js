import { supabase } from "./supabase";
import { formatLocalDate, getTodayDate } from "./date";

/**
 * حساب التقدم القرآني الشامل لطالب محدد
 * Calculate comprehensive Quran progress for a student
 */
export async function getStudentQuranProgress(studentId) {
  // جلب جميع سجلات الحفظ الجديد (لتفادي تكرار حساب الآيات)
  const { data: memRecords, error: memErr } = await supabase
    .from("memorization_records")
    .select("surah_number, surah_name, from_ayah, to_ayah, rating, date, session_type")
    .eq("student_id", studentId)
    .eq("session_type", "new")
    .order("date", { ascending: false });

  // جلب جميع سجلات التسميع لحساب متوسط التقييم ومخطط الأداء
  const { data: allMemRecords } = await supabase
    .from("memorization_records")
    .select("rating, date")
    .eq("student_id", studentId)
    .order("date", { ascending: false });

  // جلب درجات الاختبارات لحساب متوسط الاختبارات
  const { data: examRecords } = await supabase
    .from("exams")
    .select("total_score")
    .eq("student_id", studentId)
    .not("total_score", "is", null);

  if (memErr) return { progress: null, error: memErr };

  // حساب إجمالي الآيات المحفوظة مع استبعاد التكرار (surah_number:ayah)
  const memorizedAyahs = new Set();
  (memRecords || []).forEach((r) => {
    for (let ayah = r.from_ayah; ayah <= r.to_ayah; ayah++) {
      memorizedAyahs.add(`${r.surah_number}:${ayah}`);
    }
  });

  const totalMemorized = memorizedAyahs.size;
  const totalAyahs = 6236; // إجمالي آيات القرآن الكريم
  const percentage =
    totalAyahs > 0 ? Math.round((totalMemorized / totalAyahs) * 1000) / 10 : 0;

  // عدد الأجزاء التقريبي (كل جزء حوالي 208 آيات)
  const approxJuz = Math.floor(totalMemorized / 208);

  // آخر موضع وصل إليه الطالب في الحفظ
  const latestRecord = memRecords && memRecords.length > 0 ? memRecords[0] : null;

  // إجمالي جلسات التسميع
  const totalSessions = (allMemRecords || []).length;

  // متوسط التقييم العام
  const avgRating =
    totalSessions > 0
      ? Math.round(
          (allMemRecords.reduce((s, r) => s + r.rating, 0) / totalSessions) * 10
        ) / 10
      : 0;

  // متوسط درجات الاختبارات
  const avgExamScore =
    examRecords && examRecords.length > 0
      ? Math.round(
          examRecords.reduce((s, e) => s + e.total_score, 0) / examRecords.length
        )
      : 0;

  // المحفوظ في آخر 30 يومًا
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentStr = formatLocalDate(thirtyDaysAgo);
  const recentAyahs = new Set();
  (memRecords || [])
    .filter((r) => r.date >= recentStr)
    .forEach((r) => {
      for (let ayah = r.from_ayah; ayah <= r.to_ayah; ayah++) {
        recentAyahs.add(`${r.surah_number}:${ayah}`);
      }
    });

  // مسار الأداء (التقييمات عبر الزمن، آخر 20 جلسة بترتيب تصاعدي للعرض)
  const performanceTrend = (allMemRecords || [])
    .slice(0, 20)
    .reverse()
    .map((r, i) => ({
      session: i + 1,
      rating: r.rating,
      date: r.date,
    }));

  return {
    progress: {
      totalMemorized,
      totalAyahs,
      percentage,
      approxJuz,
      latestSurah: latestRecord?.surah_name || null,
      latestAyah: latestRecord
        ? `${latestRecord.from_ayah}-${latestRecord.to_ayah}`
        : null,
      latestDate: latestRecord?.date || null,
      recentMemorized: recentAyahs.size,
      totalSessions,
      avgRating,
      avgExamScore,
      totalExams: (examRecords || []).length,
      performanceTrend,
    },
    error: null,
  };
}

/**
 * جلب إحصائيات القرآن العامة للوحة التحكم
 * Get dashboard-level Quran stats
 */
export async function getDashboardQuranStats() {
  const today = getTodayDate();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = formatLocalDate(weekAgo);

  // جلسات التسميع اليوم
  const { data: todaySessions } = await supabase
    .from("memorization_records")
    .select("id")
    .eq("date", today);

  // جلسات التسميع هذا الأسبوع
  const { data: weekSessions } = await supabase
    .from("memorization_records")
    .select("id")
    .gte("date", weekAgoStr);

  // متوسط أحدث الاختبارات (حتى 50 اختبار)
  const { data: recentExams } = await supabase
    .from("exams")
    .select("total_score")
    .not("total_score", "is", null)
    .order("date", { ascending: false })
    .limit(50);

  const avgExamScore =
    recentExams && recentExams.length > 0
      ? Math.round(
          recentExams.reduce((s, e) => s + e.total_score, 0) / recentExams.length
        )
      : 0;

  // الطلاب الذين يحتاجون متابعة (متوسط تقييماتهم أقل من 3 في آخر أسبوعين)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const { data: recentMem } = await supabase
    .from("memorization_records")
    .select("student_id, rating, students(name)")
    .gte("date", formatLocalDate(twoWeeksAgo));

  // تجميع التقييمات حسب الطالب
  const studentRatings = {};
  (recentMem || []).forEach((r) => {
    if (!studentRatings[r.student_id]) {
      studentRatings[r.student_id] = { name: r.students?.name, ratings: [] };
    }
    studentRatings[r.student_id].ratings.push(r.rating);
  });

  const needsAttention = Object.entries(studentRatings)
    .map(([id, s]) => ({
      student_id: id,
      name: s.name,
      avgRating:
        Math.round((s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length) * 10) / 10,
    }))
    .filter((s) => s.avgRating < 3)
    .sort((a, b) => a.avgRating - b.avgRating)
    .slice(0, 5);

  // أفضل الطلاب أداءً (متوسط تقييم 4 فما فوق)
  const topStudents = Object.entries(studentRatings)
    .map(([id, s]) => ({
      student_id: id,
      name: s.name,
      avgRating:
        Math.round((s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length) * 10) / 10,
    }))
    .filter((s) => s.avgRating >= 4)
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 5);

  return {
    todaySessions: (todaySessions || []).length,
    weekSessions: (weekSessions || []).length,
    avgExamScore,
    totalExams: (recentExams || []).length,
    needsAttention,
    topStudents,
  };
}
