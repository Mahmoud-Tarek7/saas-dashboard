"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { formatLocalDate, getDaysAgoDate, getMonthKey, getTodayDate } from "@/lib/date";
import AuthGuard from "@/components/AuthGuard";
import DailyVerse from "@/components/DailyVerse";
import { SkeletonCard } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import { getDashboardQuranStats } from "@/lib/quranProgress";
import { getRecentMemorizationRecords } from "@/lib/memorization";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

const activityIcons = {
  student_created: "👤",
  student_updated: "✏️",
  halaqa_created: "📖",
  halaqa_updated: "📝",
  attendance_recorded: "✅",
  memorization_recorded: "📖",
  revision_recorded: "🔄",
  exam_recorded: "📝",
};

const kpiIcons = {
  totalStudents: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <path d="M15.5 8.2a3 3 0 1 1 0 5.6" />
      <path d="M17.5 14.6c2 .4 3 2 3 5.4" />
    </>
  ),
  activeStudents: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <path d="M15.5 12.5l2 2 4-4" />
    </>
  ),
  halaqat: (
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
  ),
  teachers: (
    <>
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" />
    </>
  ),
  present: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.3 2.3 4.7-5" />
    </>
  ),
  absent: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
    </>
  ),
  subscriptions: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </>
  ),
  quranSessions: (
    <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  ),
  guardians: (
    <>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 20c0-3.2 2.4-5.3 5.5-5.3S14 16.8 14 20" />
      <circle cx="17" cy="8" r="2.4" />
      <path d="M14.5 20c.3-2.2 1.8-3.8 4-4.2" />
    </>
  ),
};

function StatCard({ label, value, sub, accent = "gold", icon }) {
  const styles = {
    gold: {
      chip: "bg-gold-500/10 border-gold-500/20 text-gold-400",
      glow: "glow-gold",
      icon: "bg-gold-500/10 border-gold-500/20 text-gold-400",
    },
    emerald: {
      chip: "bg-emerald-100 border-emerald-500/20 text-emerald-500",
      glow: "glow-emerald",
      icon: "bg-emerald-100 border-emerald-500/20 text-emerald-500",
    },
    rust: {
      chip: "bg-rust-100 border-rust-500/20 text-rust-500",
      glow: "glow-rust",
      icon: "bg-rust-100 border-rust-500/20 text-rust-500",
    },
  };
  const s = styles[accent];
  return (
    <div className={`bg-navy-800/70 border border-navy-600 rounded-2xl p-5 transition-all ${s.glow}`}>
      <div className="flex items-center gap-2.5 mb-3">
        {icon && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${s.icon}`}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {icon}
            </svg>
          </span>
        )}
        <p className="text-mist-400 text-sm">{label}</p>
      </div>
      <div className="flex items-end justify-between">
        <span className="font-display text-3xl font-bold text-parchment-100">{value}</span>
        {sub && (
          <span className={`text-xs px-2.5 py-1 rounded-full border ${s.chip}`}>{sub}</span>
        )}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-navy-950 border border-gold-500/30 rounded-lg px-3 py-2 text-xs glow-border-gold">
        <p className="text-mist-400 mb-1">{label}</p>
        <p className="text-gold-400 font-bold">{payload[0].value} حاضر</p>
      </div>
    );
  }
  return null;
};

function DashboardContent() {
  const router = useRouter();
  const [halaqat, setHalaqat] = useState([]);
  const [counts, setCounts] = useState({});
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalHalaqat: 0,
    totalTeachers: 0,
    presentToday: 0,
    absentToday: 0,
    unpaid: 0,
    totalGuardians: 0,
    activeGuardians: 0,
  });
  const [quranDashboardStats, setQuranDashboardStats] = useState({
    todaySessions: 0,
    weekSessions: 0,
    avgExamScore: 0,
    totalExams: 0,
    needsAttention: [],
    topStudents: [],
  });
  const [recentMemorizations, setRecentMemorizations] = useState([]);
  const [weekData, setWeekData] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const today = getTodayDate();
  const month = getMonthKey();

  useEffect(() => {
    async function load() {
      setError(false);
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const sevenDaysAgoStr = getDaysAgoDate(6);

        const [
          { data: halaqatData, error: halaqatErr },
          { data: studentsData, error: studentsErr },
          { data: attendanceToday, error: attErr },
          { data: subsThisMonth },
          { data: weekAttendance },
          { data: activityData },
          qStats,
          { data: recentMemData },
          { data: guardiansData },
          { data: teachersData },
        ] = await Promise.all([
          supabase.from("halaqat").select("*").order("created_at"),
          supabase.from("students").select("id, halaqa_id, is_active"),
          supabase.from("attendance").select("student_id, status").eq("date", today),
          supabase.from("subscriptions").select("student_id").eq("month", month),
          supabase
            .from("attendance")
            .select("date, status")
            .gte("date", sevenDaysAgoStr)
            .eq("status", "present"),
          supabase
            .from("activity_log")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
          getDashboardQuranStats(),
          getRecentMemorizationRecords(5),
          supabase.from("guardians").select("id, is_active"),
          supabase.from("teachers").select("id, is_active"),
        ]);

        if (halaqatErr || studentsErr || attErr) throw halaqatErr || studentsErr || attErr;

        const dayNames = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
        const dayMap = {};
        for (let i = 0; i < 7; i++) {
          const d = new Date(sevenDaysAgo);
          d.setDate(d.getDate() + i);
          const key = formatLocalDate(d);
          dayMap[key] = { day: dayNames[d.getDay()], حاضر: 0 };
        }
        (weekAttendance || []).forEach((a) => {
          if (dayMap[a.date]) dayMap[a.date].حاضر += 1;
        });

        const activeStudents = (studentsData || []).filter((s) => s.is_active);
        const countMap = {};
        activeStudents.forEach((s) => {
          countMap[s.halaqa_id] = (countMap[s.halaqa_id] || 0) + 1;
        });

        const presentToday = (attendanceToday || []).filter((a) => a.status === "present").length;
        const absentToday = (attendanceToday || []).filter((a) => a.status === "absent").length;

        const paidIds = new Set((subsThisMonth || []).map((s) => s.student_id));
        const unpaid = activeStudents.filter((s) => !paidIds.has(s.id)).length;

        const legacyTeachersCount = new Set(
          (halaqatData || []).map((h) => h.teacher_name).filter(Boolean)
        ).size;
        const totalTeachers = teachersData && teachersData.length > 0
          ? teachersData.filter((t) => t.is_active).length
          : legacyTeachersCount;

        setHalaqat(halaqatData || []);
        setCounts(countMap);
        setStats({
          totalStudents: (studentsData || []).length,
          activeStudents: activeStudents.length,
          totalHalaqat: (halaqatData || []).length,
          totalTeachers,
          presentToday,
          absentToday,
          unpaid,
          totalGuardians: (guardiansData || []).length,
          activeGuardians: (guardiansData || []).filter((g) => g.is_active).length,
        });
        setQuranDashboardStats(qStats || {});
        setRecentMemorizations(recentMemData || []);
        setWeekData(Object.values(dayMap));
        setActivity(activityData || []);
      } catch (e) {
        console.error(e);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [today, month]);

  const todayLabel = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-parchment-100 glow-text-gold">
            الرئيسية
          </h1>
          <p className="text-mist-400 text-sm mt-1.5">{todayLabel}</p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => router.push("/memorization?new=1")}
            className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5"
          >
            <span>📖</span>
            <span>+ تسميع</span>
          </button>
          <button
            onClick={() => router.push("/students?new=1")}
            className="bg-navy-800 border border-navy-600 hover:border-gold-500/40 text-parchment-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + طالب
          </button>
          <button
            onClick={() => router.push("/halaqat?new=1")}
            className="bg-navy-800 border border-navy-600 hover:border-gold-500/40 text-parchment-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + حلقة
          </button>
          <button
            onClick={() => router.push("/halaqat")}
            className="bg-navy-800 border border-navy-600 hover:border-gold-500/40 text-parchment-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            تسجيل حضور
          </button>
        </div>
      </div>

      <div className="mb-8">
        <DailyVerse />
      </div>

      {error && (
        <div className="mb-8 border border-rust-500/30 bg-rust-100 text-rust-500 rounded-xl px-5 py-4 text-sm">
          حصل خطأ في تحميل بيانات الرئيسية. تأكد من الاتصال وحدّث الصفحة.
        </div>
      )}

      {/* KPI Cards (مع إضافات القرآن الكريم لـ Sprint 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              label="إجمالي الطلاب"
              value={stats.totalStudents}
              icon={kpiIcons.totalStudents}
            />
            <StatCard
              label="الطلاب النشطون"
              value={stats.activeStudents}
              sub={`من ${stats.totalStudents}`}
              accent="emerald"
              icon={kpiIcons.activeStudents}
            />
            <StatCard
              label="إجمالي الحلقات"
              value={stats.totalHalaqat}
              icon={kpiIcons.halaqat}
            />
            <StatCard
              label="إجمالي المحفظين"
              value={stats.totalTeachers}
              icon={kpiIcons.teachers}
            />
            <StatCard
              label="الحضور اليوم"
              value={stats.presentToday}
              sub={`من ${stats.activeStudents}`}
              accent="emerald"
              icon={kpiIcons.present}
            />
            <StatCard
              label="جلسات التسميع (أسبوع)"
              value={quranDashboardStats.weekSessions || 0}
              sub={quranDashboardStats.todaySessions ? `${quranDashboardStats.todaySessions} اليوم` : "0 اليوم"}
              accent="gold"
              icon={kpiIcons.quranSessions}
            />
            <StatCard
              label="متوسط الاختبارات"
              value={quranDashboardStats.avgExamScore ? `${quranDashboardStats.avgExamScore}%` : "—"}
              sub={quranDashboardStats.totalExams ? `${quranDashboardStats.totalExams} اختبار` : "لا يوجد"}
              accent="emerald"
              icon={kpiIcons.quranExams}
            />
            <StatCard
              label="متأخرين في الاشتراك"
              value={stats.unpaid}
              sub={month}
              accent="rust"
              icon={kpiIcons.subscriptions}
            />
            <StatCard
              label="أولياء الأمور"
              value={stats.totalGuardians}
              sub={`${stats.activeGuardians} نشط`}
              icon={kpiIcons.guardians}
            />
            <StatCard
              label="غياب اليوم (للتواصل)"
              value={stats.absentToday}
              sub="يحتاج متابعة ولي الأمر"
              accent="rust"
              icon={kpiIcons.absent}
            />
          </>
        )}
      </div>

      {/* قسم آخر عمليات التسميع ومتابعة الطلاب القرآنيين (Sprint 2) */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* آخر التسميعات */}
          <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-parchment-100 flex items-center gap-2">
                <span>📖</span>
                <span>آخر عمليات التسميع</span>
              </h2>
              <Link
                href="/memorization"
                className="text-xs text-gold-400 hover:text-gold-300 transition-colors"
              >
                عرض كل التسميع ←
              </Link>
            </div>

            {recentMemorizations.length === 0 ? (
              <p className="text-mist-500 text-sm py-4">لم يتم تسجيل أي تسميع مؤخرًا.</p>
            ) : (
              <div className="divide-y divide-navy-700">
                {recentMemorizations.map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <Link
                        href={`/students/${m.student_id}`}
                        className="font-medium text-parchment-100 hover:text-gold-400 text-sm transition-colors"
                      >
                        {m.students?.name || "طالب"}
                      </Link>
                      <p className="text-xs text-mist-400 mt-0.5">
                        سورة {m.surah_name} (آيات {m.from_ayah}-{m.to_ayah}) ·{" "}
                        <span className="text-mist-500">{m.halaqat?.name}</span>
                      </p>
                    </div>
                    <div className="text-left shrink-0">
                      <div className="flex items-center gap-0.5 justify-end">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= m.rating ? "text-gold-400 fill-gold-400" : "text-navy-600"
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-[11px] text-mist-500 mt-0.5">{timeAgo(m.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* طلاب يحتاجون متابعة */}
          <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-6">
            <h2 className="font-display font-bold text-lg text-parchment-100 mb-4 flex items-center gap-2">
              <span>⚠️</span>
              <span>طلاب يحتاجون متابعة في الحفظ</span>
            </h2>

            {!quranDashboardStats.needsAttention || quranDashboardStats.needsAttention.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-emerald-500 text-sm font-medium">ممتاز! لا يوجد طلاب متعثرون حاليًا 🌟</p>
                <p className="text-mist-500 text-xs mt-1">جميع الطلاب مستواهم التقييمي جيد أو أعلى.</p>
              </div>
            ) : (
              <div className="divide-y divide-navy-700">
                {quranDashboardStats.needsAttention.map((s) => (
                  <div key={s.student_id} className="py-3 flex items-center justify-between">
                    <Link
                      href={`/students/${s.student_id}`}
                      className="text-sm font-medium text-parchment-100 hover:text-gold-400 transition-colors"
                    >
                      {s.name}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rust-500 bg-rust-100 border border-rust-500/20 px-2.5 py-0.5 rounded-full">
                        متوسط: {s.avgRating} / 5
                      </span>
                      <Link
                        href={`/students/${s.student_id}`}
                        className="text-xs text-mist-400 hover:text-parchment-100 px-2 py-1 rounded bg-navy-700 transition-colors"
                      >
                        متابعة
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* شارت الحضور */}
        <div className="lg:col-span-2 bg-navy-800/70 border border-navy-600 rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg text-parchment-100 mb-4">
            الحضور خلال آخر 7 أيام
          </h2>
          {loading ? (
            <div className="h-[220px] flex items-center justify-center text-mist-500 text-sm">
              جاري التحميل...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekData}>
                <defs>
                  <linearGradient id="goldGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E8C766" stopOpacity={1} />
                    <stop offset="100%" stopColor="#B4922A" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1B3A54" vertical={false} />
                <XAxis dataKey="day" stroke="#6D8299" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6D8299" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(212,175,55,0.06)" }} />
                <Bar dataKey="حاضر" fill="url(#goldGlow)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg text-parchment-100 mb-4">
            آخر النشاطات
          </h2>
          {loading ? (
            <p className="text-mist-500 text-sm">جاري التحميل...</p>
          ) : activity.length === 0 ? (
            <p className="text-mist-500 text-sm">لا يوجد نشاط مسجل بعد.</p>
          ) : (
            <ul className="space-y-3.5">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-2.5 text-sm">
                  <span className="shrink-0">{activityIcons[a.type] || "•"}</span>
                  <div>
                    <p className="text-parchment-100">{a.description}</p>
                    <p className="text-mist-500 text-xs mt-0.5">{timeAgo(a.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h2 className="font-display font-bold text-xl text-parchment-100 mb-4">
        توزيع الطلاب على الحلقات
      </h2>

      {loading ? (
        <div className="space-y-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : halaqat.length === 0 ? (
        <EmptyState
          title="لا توجد حلقات بعد"
          description="أنشئ أول حلقة للبدء في تسجيل الطلاب والحضور."
          actionLabel="+ إنشاء حلقة"
          onAction={() => router.push("/halaqat?new=1")}
        />
      ) : (
        <div className="divide-y divide-navy-700 border border-navy-600 rounded-2xl bg-navy-800/50 overflow-hidden">
          {halaqat.map((h) => (
            <Link
              key={h.id}
              href={`/halaqat/${h.id}`}
              className="flex items-center justify-between px-6 py-4.5 hover:bg-navy-800 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full pulse-dot ${
                    h.type === "intensive" ? "bg-gold-500" : "bg-emerald-500"
                  }`}
                />
                <div>
                  <p className="font-medium text-parchment-100">{h.name}</p>
                  <p className="text-xs text-mist-500 mt-0.5">
                    {counts[h.id] || 0} طالب
                    {h.teacher_name ? ` · ${h.teacher_name}` : ""}
                    {h.type === "intensive" ? " · يوم مكثف" : ""}
                  </p>
                </div>
              </div>
              <span className="text-gold-400 text-sm">التفاصيل ←</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
