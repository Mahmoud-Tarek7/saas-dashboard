"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthGuard from "@/components/AuthGuard";
import CircularProgress from "@/components/CircularProgress";
import { Skeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import QuranProgressCard from "@/components/QuranProgressCard";
import PerformanceChart from "@/components/PerformanceChart";
import WeakAreasCard from "@/components/WeakAreasCard";
import RecordHistoryTable from "@/components/RecordHistoryTable";
import MemorizationFormModal from "@/components/MemorizationFormModal";
import RevisionFormModal from "@/components/RevisionFormModal";
import ExamFormModal from "@/components/ExamFormModal";
import { getStudentQuranProgress } from "@/lib/quranProgress";
import { getStudentMemorizationHistory } from "@/lib/memorization";
import { getStudentRevisionHistory, getWeakAreas } from "@/lib/revision";
import { getStudentExamHistory } from "@/lib/exams";

function StudentDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [quranProgress, setQuranProgress] = useState(null);
  const [memorizationHistory, setMemorizationHistory] = useState([]);
  const [revisionHistory, setRevisionHistory] = useState([]);
  const [examHistory, setExamHistory] = useState([]);
  const [weakAreas, setWeakAreas] = useState([]);
  const [halaqat, setHalaqat] = useState([]);

  // Modals state
  const [memModalOpen, setMemModalOpen] = useState(false);
  const [revModalOpen, setRevModalOpen] = useState(false);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [activeQuranTab, setActiveQuranTab] = useState("memorization");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadData = useCallback(async () => {
    setError(false);
    try {
      const [
        { data: studentData, error: sErr },
        { data: attendanceData },
        { data: subsData },
        { data: halaqatData },
        { progress: progData },
        { data: memData },
        { data: revData },
        { data: examData },
        { weakAreas: weakData },
      ] = await Promise.all([
        supabase
          .from("students")
          .select("*, halaqat(name, teacher_name)")
          .eq("id", id)
          .single(),
        supabase
          .from("attendance")
          .select("date, status")
          .eq("student_id", id)
          .order("date", { ascending: false })
          .limit(30),
        supabase
          .from("subscriptions")
          .select("*")
          .eq("student_id", id)
          .order("payment_date", { ascending: false }),
        supabase.from("halaqat").select("id, name, teacher_name, is_active"),
        getStudentQuranProgress(id),
        getStudentMemorizationHistory(id, 50),
        getStudentRevisionHistory(id, 50),
        getStudentExamHistory(id, 50),
        getWeakAreas(id),
      ]);

      if (sErr || !studentData) {
        setNotFound(true);
        return;
      }

      setStudent(studentData);
      setAttendance(attendanceData || []);
      setSubscriptions(subsData || []);
      setHalaqat(halaqatData || []);
      setQuranProgress(progData);
      setMemorizationHistory(memData || []);
      setRevisionHistory(revData || []);
      setExamHistory(examData || []);
      setWeakAreas(weakData || []);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const presentCount = attendance.filter((a) => a.status === "present").length;
  const attendanceRate =
    attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  const joinDateLabel = student?.join_date
    ? new Date(student.join_date).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  if (notFound) {
    return (
      <EmptyState
        title="الطالب غير موجود"
        description="ربما تم حذفه أو الرابط غير صحيح."
        actionLabel="← رجوع للطلاب"
        onAction={() => router.push("/students")}
      />
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={() => router.push("/students")}
          className="text-sm text-mist-400 hover:text-gold-400 transition-colors"
        >
          → رجوع للطلاب
        </button>

        {/* Quick Action Buttons for Teachers */}
        {!loading && student && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setMemModalOpen(true)}
              className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-3.5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5"
            >
              <span>📖</span>
              <span>تسجيل تسميع</span>
            </button>
            <button
              onClick={() => setRevModalOpen(true)}
              className="bg-navy-800 border border-navy-600 hover:border-gold-500/40 text-parchment-100 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <span>🔄</span>
              <span>تسجيل مراجعة</span>
            </button>
            <button
              onClick={() => setExamModalOpen(true)}
              className="bg-navy-800 border border-navy-600 hover:border-gold-500/40 text-parchment-100 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <span>📝</span>
              <span>تسجيل اختبار</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="border border-rust-500/30 bg-rust-100 text-rust-500 rounded-xl px-5 py-4 text-sm">
          حصل خطأ في تحميل بيانات الطالب. حاول تحديث الصفحة.
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-9 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Skeleton className="h-48" />
            <Skeleton className="h-48 md:col-span-2" />
          </div>
        </div>
      ) : (
        <>
          {/* 1. معلومات الطالب الأساسية */}
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-navy-700/60 pb-6">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display font-bold text-3xl text-parchment-100 glow-text-gold">
                  {student.name}
                </h1>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    student.is_active
                      ? "bg-emerald-100 text-emerald-500 border-emerald-500/20"
                      : "bg-rust-100 text-rust-500 border-rust-500/20"
                  }`}
                >
                  {student.is_active ? "نشط" : "متوقف"}
                </span>
              </div>
              <p className="text-mist-400 text-sm mt-1.5">
                {student.halaqat?.name || "بدون حلقة"}
                {student.halaqat?.teacher_name ? ` · المحفظ: ${student.halaqat.teacher_name}` : ""}
                {" · "}ولي الأمر: {student.parent_phone || "—"}
              </p>
              <p className="text-mist-500 text-xs mt-1">تاريخ التسجيل: {joinDateLabel}</p>
            </div>

            <button
              onClick={() => router.push(`/students?edit=${id}`)}
              className="bg-navy-800 border border-navy-600 hover:border-gold-500/40 text-parchment-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              تعديل البيانات
            </button>
          </div>

          {/* 2. التقدم القرآني ومخطط الأداء */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <QuranProgressCard progress={quranProgress} />
            </div>
            <div>
              <WeakAreasCard weakAreas={weakAreas} />
            </div>
          </div>

          {/* 3. رسم بياني لتطور الأداء */}
          {quranProgress?.performanceTrend && quranProgress.performanceTrend.length > 0 && (
            <div>
              <PerformanceChart data={quranProgress.performanceTrend} />
            </div>
          )}

          {/* 4. سجلات القرآن بنظام التبويبات */}
          <div className="bg-navy-800/40 border border-navy-700/60 rounded-2xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-navy-700 pb-4 mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setActiveQuranTab("memorization")}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeQuranTab === "memorization"
                      ? "bg-gold-500 text-navy-950 glow-gold"
                      : "text-mist-400 hover:text-parchment-100 hover:bg-navy-700/50"
                  }`}
                >
                  سجل الحفظ والتسميع ({memorizationHistory.length})
                </button>
                <button
                  onClick={() => setActiveQuranTab("revision")}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeQuranTab === "revision"
                      ? "bg-gold-500 text-navy-950 glow-gold"
                      : "text-mist-400 hover:text-parchment-100 hover:bg-navy-700/50"
                  }`}
                >
                  سجل المراجعة ({revisionHistory.length})
                </button>
                <button
                  onClick={() => setActiveQuranTab("exams")}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeQuranTab === "exams"
                      ? "bg-gold-500 text-navy-950 glow-gold"
                      : "text-mist-400 hover:text-parchment-100 hover:bg-navy-700/50"
                  }`}
                >
                  سجل الاختبارات ({examHistory.length})
                </button>
              </div>

              <div>
                {activeQuranTab === "memorization" && (
                  <button
                    onClick={() => setMemModalOpen(true)}
                    className="text-xs bg-navy-700 hover:bg-navy-600 text-gold-400 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    + إضافة تسميع
                  </button>
                )}
                {activeQuranTab === "revision" && (
                  <button
                    onClick={() => setRevModalOpen(true)}
                    className="text-xs bg-navy-700 hover:bg-navy-600 text-gold-400 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    + إضافة مراجعة
                  </button>
                )}
                {activeQuranTab === "exams" && (
                  <button
                    onClick={() => setExamModalOpen(true)}
                    className="text-xs bg-navy-700 hover:bg-navy-600 text-gold-400 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    + إضافة اختبار
                  </button>
                )}
              </div>
            </div>

            {activeQuranTab === "memorization" && (
              <RecordHistoryTable
                records={memorizationHistory}
                type="memorization"
                showStudentName={false}
                emptyMessage="لا يوجد سجل تسميع مسجل لهذا الطالب بعد."
              />
            )}

            {activeQuranTab === "revision" && (
              <RecordHistoryTable
                records={revisionHistory}
                type="revision"
                showStudentName={false}
                emptyMessage="لا يوجد سجل مراجعة مسجل لهذا الطالب بعد."
              />
            )}

            {activeQuranTab === "exams" && (
              <RecordHistoryTable
                records={examHistory}
                type="exam"
                showStudentName={false}
                emptyMessage="لا يوجد اختبارات مسجلة لهذا الطالب بعد."
              />
            )}
          </div>

          {/* 5. الحضور والاشتراكات */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-6 flex flex-col items-center justify-center glow-emerald">
              <CircularProgress
                percent={attendanceRate}
                label="نسبة الحضور (آخر 30 سجل)"
                color="#2F9E6E"
              />
            </div>

            <div className="md:col-span-2 bg-navy-800/70 border border-navy-600 rounded-2xl p-6">
              <h2 className="font-display font-bold text-lg text-parchment-100 mb-4">
                سجل الحضور الأخير
              </h2>
              {attendance.length === 0 ? (
                <p className="text-mist-400 text-sm">لا يوجد سجل حضور بعد.</p>
              ) : (
                <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
                  {attendance.slice(0, 20).map((a, i) => (
                    <div
                      key={i}
                      title={`${a.date} - ${a.status === "present" ? "حاضر" : "غائب"}`}
                      className={`h-8 w-8 rounded-md border ${
                        a.status === "present"
                          ? "bg-emerald-500/20 border-emerald-500/40"
                          : "bg-rust-500/20 border-rust-500/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl text-parchment-100">
              سجل الاشتراكات
            </h2>
            {subscriptions.length === 0 ? (
              <div className="bg-navy-800/40 border border-navy-700/60 rounded-2xl p-6 text-center text-mist-400">
                لا يوجد سجل دفعات بعد.
              </div>
            ) : (
              <div className="divide-y divide-navy-700 border border-navy-600 rounded-2xl bg-navy-800/50 overflow-hidden">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-parchment-100 font-medium">{sub.month}</p>
                      <p className="text-xs text-mist-500 mt-0.5">
                        {sub.payment_method === "cash" ? "كاش" : "فودافون كاش"} ·{" "}
                        {sub.payment_date}
                      </p>
                    </div>
                    <span className="text-sm px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-500 border border-emerald-500/20">
                      {sub.amount} جنيه
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Modals */}
          {student && (
            <>
              <MemorizationFormModal
                open={memModalOpen}
                onClose={() => setMemModalOpen(false)}
                onSaved={loadData}
                students={[student]}
                halaqat={halaqat}
                fixedStudentId={student.id}
                fixedHalaqaId={student.halaqa_id}
              />

              <RevisionFormModal
                open={revModalOpen}
                onClose={() => setRevModalOpen(false)}
                onSaved={loadData}
                students={[student]}
                halaqat={halaqat}
                fixedStudentId={student.id}
                fixedHalaqaId={student.halaqa_id}
              />

              <ExamFormModal
                open={examModalOpen}
                onClose={() => setExamModalOpen(false)}
                onSaved={loadData}
                students={[student]}
                halaqat={halaqat}
                fixedStudentId={student.id}
                fixedHalaqaId={student.halaqa_id}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function StudentDetailPage() {
  return (
    <AuthGuard>
      <StudentDetailContent />
    </AuthGuard>
  );
}
