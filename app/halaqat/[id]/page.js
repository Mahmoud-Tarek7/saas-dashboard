"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { transferStudent } from "@/lib/students";
import { setHalaqaActive } from "@/lib/halaqat";
import AuthGuard from "@/components/AuthGuard";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/Skeleton";
import { getTodayDate } from "@/lib/date";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import HalaqaFormModal from "@/components/HalaqaFormModal";
import StudentFormModal from "@/components/StudentFormModal";
import MemorizationFormModal from "@/components/MemorizationFormModal";
import RevisionFormModal from "@/components/RevisionFormModal";
import { getHalaqaMemorizationStats } from "@/lib/memorization";
import { getHalaqaRevisionStats } from "@/lib/revision";
import { getHalaqaExamStats } from "@/lib/exams";

function HalaqaDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const { addToast } = useToast();

  const [halaqa, setHalaqa] = useState(null);
  const [students, setStudents] = useState([]);
  const [allHalaqat, setAllHalaqat] = useState([]);
  const [todayStats, setTodayStats] = useState({ present: 0, absent: 0 });
  const [quranStats, setQuranStats] = useState({
    avgMemRating: 0,
    memSessions: 0,
    avgMastery: 0,
    revSessions: 0,
    avgExamScore: 0,
    totalExams: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [memModalOpen, setMemModalOpen] = useState(false);
  const [revModalOpen, setRevModalOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [transferringId, setTransferringId] = useState(null);
  const [transferTo, setTransferTo] = useState("");
  const [transferSaving, setTransferSaving] = useState(false);

  const today = getTodayDate();

  const load = useCallback(async () => {
    setError(false);
    try {
      const [
        { data: halaqaData, error: hErr },
        { data: studentsData },
        { data: attendanceToday },
        { data: allHalaqatData },
        memStats,
        revStats,
        examStats,
      ] = await Promise.all([
        supabase.from("halaqat").select("*, teachers(id, name)").eq("id", id).single(),
        supabase
          .from("students")
          .select("*")
          .eq("halaqa_id", id)
          .eq("is_active", true)
          .order("name"),
        supabase.from("attendance").select("status").eq("halaqa_id", id).eq("date", today),
        supabase.from("halaqat").select("*").order("name"),
        getHalaqaMemorizationStats(id),
        getHalaqaRevisionStats(id),
        getHalaqaExamStats(id),
      ]);

      if (hErr || !halaqaData) {
        setNotFound(true);
        return;
      }

      setHalaqa(halaqaData);
      setStudents(studentsData || []);
      setAllHalaqat((allHalaqatData || []).filter((h) => h.id !== id && h.is_active));
      setTodayStats({
        present: (attendanceToday || []).filter((a) => a.status === "present").length,
        absent: (attendanceToday || []).filter((a) => a.status === "absent").length,
      });
      setQuranStats({
        avgMemRating: memStats?.avgRating || 0,
        memSessions: memStats?.totalSessions || 0,
        avgMastery: revStats?.avgMastery || 0,
        revSessions: revStats?.totalSessions || 0,
        avgExamScore: examStats?.avgScore || 0,
        totalExams: examStats?.totalExams || 0,
      });
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id, today]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggleActive() {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    const { error } = await setHalaqaActive(
      confirmTarget.id,
      confirmTarget.name,
      !confirmTarget.is_active
    );
    setConfirmLoading(false);
    setConfirmTarget(null);
    if (error) {
      addToast("حصل خطأ، حاول تاني", "error");
    } else {
      addToast(confirmTarget.is_active ? "تم إيقاف الحلقة" : "تم إعادة تفعيل الحلقة", "success");
      load();
    }
  }

  async function handleTransferConfirm(student) {
    if (!transferTo) {
      addToast("اختر الحلقة الجديدة الأول", "error");
      return;
    }
    setTransferSaving(true);
    const { error } = await transferStudent(student.id, student.name, transferTo);
    setTransferSaving(false);
    setTransferringId(null);
    setTransferTo("");
    if (error) {
      addToast("حصل خطأ في النقل، حاول تاني", "error");
    } else {
      addToast(`تم نقل ${student.name} لحلقة جديدة`, "success");
      load();
    }
  }

  if (notFound) {
    return (
      <EmptyState
        title="الحلقة غير موجودة"
        description="ربما تم حذفها أو الرابط غير صحيح."
        actionLabel="← رجوع لكل الحلقات"
        onAction={() => router.push("/halaqat")}
      />
    );
  }

  return (
    <div>
      <button
        onClick={() => router.push("/halaqat")}
        className="text-sm text-mist-400 hover:text-gold-400 mb-5 transition-colors"
      >
        → رجوع لكل الحلقات
      </button>

      {error && (
        <div className="mb-6 border border-rust-500/30 bg-rust-100 text-rust-500 rounded-xl px-5 py-4 text-sm">
          حصل خطأ في تحميل بيانات الحلقة. حاول تحديث الصفحة.
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-9 w-48" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      ) : (
        <>
          {/* رأس الصفحة */}
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display font-bold text-3xl text-parchment-100 glow-text-gold">
                  {halaqa.name}
                </h1>
                {!halaqa.is_active && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-rust-100 text-rust-500 border border-rust-500/20">
                    متوقفة
                  </span>
                )}
              </div>
              <p className="text-mist-400 text-sm mt-1.5">
                {(halaqa.teachers?.name || halaqa.teacher_name)
                  ? `المحفظ: ${halaqa.teachers?.name || halaqa.teacher_name}`
                  : "لا يوجد محفظ مسجل"}
                {" · "}
                {halaqa.section === "women" ? "قسم النساء" : "قسم الرجال"}
                {" · "}
                {halaqa.type === "intensive" ? "يوم مكثف" : "حلقة عادية"}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/halaqa/${id}/attendance`}
                className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                تسجيل الحضور
              </Link>
              <button
                onClick={() => setMemModalOpen(true)}
                className="bg-navy-800 border border-navy-600 hover:border-gold-500/40 text-gold-400 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                + تسميع للحلقة
              </button>
              <button
                onClick={() => setRevModalOpen(true)}
                className="bg-navy-800 border border-navy-600 hover:border-gold-500/40 text-parchment-100 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                + مراجعة للحلقة
              </button>
              <button
                onClick={() => setEditOpen(true)}
                className="bg-navy-800 border border-navy-600 hover:border-gold-500/40 text-parchment-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                تعديل
              </button>
              <button
                onClick={() => setConfirmTarget(halaqa)}
                className="bg-navy-800 border border-navy-600 hover:border-rust-500/40 text-mist-400 hover:text-rust-500 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {halaqa.is_active ? "إيقاف" : "تفعيل"}
              </button>
            </div>
          </div>

          {/* إحصائيات اليوم */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-5">
              <p className="text-mist-400 text-sm mb-2">عدد الطلاب</p>
              <span className="font-display text-3xl font-bold text-parchment-100">
                {students.length}
              </span>
            </div>
            <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-5 glow-emerald">
              <p className="text-mist-400 text-sm mb-2">الحضور اليوم</p>
              <span className="font-display text-3xl font-bold text-emerald-500">
                {todayStats.present}
              </span>
            </div>
            <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-5 glow-rust">
              <p className="text-mist-400 text-sm mb-2">الغياب اليوم</p>
              <span className="font-display text-3xl font-bold text-rust-500">
                {todayStats.absent}
              </span>
            </div>
          </div>

          {/* أداء الحلقة في القرآن الكريم (Sprint 2) */}
          <div className="mb-10 bg-navy-800/40 border border-navy-700/70 rounded-2xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xl">📖</span>
                <h2 className="font-display font-bold text-xl text-parchment-100">
                  أداء الحلقة في القرآن
                </h2>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400">
                إحصائيات الإتقان والتقييم
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-navy-900/80 border border-navy-700 rounded-xl p-4.5 glow-gold">
                <p className="text-mist-400 text-xs mb-1">متوسط تقييم التسميع</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl font-bold text-gold-400">
                    {quranStats.avgMemRating ? `${quranStats.avgMemRating} / 5` : "—"}
                  </span>
                  <span className="text-xs text-mist-500">
                    ({quranStats.memSessions} جلسة)
                  </span>
                </div>
              </div>

              <div className="bg-navy-900/80 border border-navy-700 rounded-xl p-4.5 glow-emerald">
                <p className="text-mist-400 text-xs mb-1">متوسط إتقان المراجعة</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl font-bold text-emerald-500">
                    {quranStats.avgMastery ? `${quranStats.avgMastery} / 5` : "—"}
                  </span>
                  <span className="text-xs text-mist-500">
                    ({quranStats.revSessions} جلسة)
                  </span>
                </div>
              </div>

              <div className="bg-navy-900/80 border border-navy-700 rounded-xl p-4.5">
                <p className="text-mist-400 text-xs mb-1">متوسط درجات الاختبارات</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl font-bold text-parchment-100">
                    {quranStats.avgExamScore ? `${quranStats.avgExamScore}%` : "—"}
                  </span>
                  <span className="text-xs text-mist-500">
                    ({quranStats.totalExams} اختبار)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ليستة الطلاب */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-display font-bold text-xl text-parchment-100">
              الطلاب المسجلين
            </h2>
            <button
              onClick={() => setAddStudentOpen(true)}
              disabled={!halaqa.is_active}
              title={!halaqa.is_active ? "الحلقة متوقفة حاليًا - فعّلها أولًا لإضافة طلاب" : ""}
              className="text-sm px-4 py-1.5 rounded-lg bg-navy-800 border border-navy-600 hover:border-gold-500/40 text-parchment-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-navy-600"
            >
              + إضافة طالب لهذه الحلقة
            </button>
          </div>

          {students.length === 0 ? (
            <EmptyState
              title="لا يوجد طلاب في هذه الحلقة بعد"
              description="أضف أول طالب لبدء تسجيل الحضور والتسميع."
              actionLabel="+ إضافة طالب"
              onAction={() => setAddStudentOpen(true)}
            />
          ) : (
            <div className="divide-y divide-navy-700 border border-navy-600 rounded-2xl bg-navy-800/50 overflow-hidden">
              {students.map((s) => (
                <div key={s.id} className="px-6 py-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Link href={`/students/${s.id}`} className="flex-1 min-w-[140px]">
                      <span className="font-medium text-parchment-100 hover:text-gold-400 transition-colors">
                        {s.name}
                      </span>
                      {s.parent_phone && (
                        <span className="text-xs text-mist-500 block mt-0.5" dir="ltr">
                          {s.parent_phone}
                        </span>
                      )}
                    </Link>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/students/${s.id}`}
                        className="text-xs text-gold-400 hover:text-gold-300 px-2.5 py-1 rounded bg-navy-700/60 transition-colors"
                      >
                        ملف الطالب
                      </Link>

                      {transferringId === s.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={transferTo}
                            onChange={(e) => setTransferTo(e.target.value)}
                            className="text-xs rounded-lg border border-navy-600 bg-navy-900 px-2.5 py-1 text-parchment-100 outline-none focus:border-gold-500"
                          >
                            <option value="">اختر الحلقة الجديدة</option>
                            {allHalaqat.map((h) => (
                              <option key={h.id} value={h.id}>
                                {h.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleTransferConfirm(s)}
                            disabled={transferSaving}
                            className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-2.5 py-1 rounded text-xs font-bold disabled:opacity-60"
                          >
                            تأكيد
                          </button>
                          <button
                            onClick={() => {
                              setTransferringId(null);
                              setTransferTo("");
                            }}
                            className="text-xs text-mist-400 hover:text-parchment-100 px-1"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setTransferringId(s.id);
                            setTransferTo("");
                          }}
                          disabled={allHalaqat.length === 0}
                          className="text-xs text-mist-400 hover:text-parchment-100 px-2 py-1 rounded hover:bg-navy-700/60 transition-colors disabled:opacity-40"
                        >
                          نقل لحلقة أخرى
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal Forms */}
          <HalaqaFormModal
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onSaved={load}
            editingHalaqa={halaqa}
          />

          <StudentFormModal
            open={addStudentOpen}
            onClose={() => setAddStudentOpen(false)}
            onSaved={load}
            halaqat={[halaqa, ...allHalaqat]}
            fixedHalaqaId={id}
          />

          <MemorizationFormModal
            open={memModalOpen}
            onClose={() => setMemModalOpen(false)}
            onSaved={load}
            students={students}
            halaqat={[halaqa]}
            fixedHalaqaId={id}
          />

          <RevisionFormModal
            open={revModalOpen}
            onClose={() => setRevModalOpen(false)}
            onSaved={load}
            students={students}
            halaqat={[halaqa]}
            fixedHalaqaId={id}
          />

          <ConfirmDialog
            open={!!confirmTarget}
            title={confirmTarget?.is_active ? "إيقاف الحلقة" : "إعادة تفعيل الحلقة"}
            message={
              confirmTarget?.is_active
                ? `هل أنت متأكد من إيقاف حلقة "${confirmTarget?.name}"؟`
                : `هل تريد إعادة تفعيل حلقة "${confirmTarget?.name}"؟`
            }
            confirmLabel={confirmTarget?.is_active ? "إيقاف" : "تفعيل"}
            danger={confirmTarget?.is_active}
            loading={confirmLoading}
            onConfirm={handleToggleActive}
            onCancel={() => setConfirmTarget(null)}
          />
        </>
      )}
    </div>
  );
}

export default function HalaqaDetailPage() {
  return (
    <AuthGuard>
      <HalaqaDetailContent />
    </AuthGuard>
  );
}
