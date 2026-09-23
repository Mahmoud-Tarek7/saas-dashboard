"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getGuardianChildSummaries,
  unlinkGuardianStudent,
} from "@/lib/guardians";
import AuthGuard from "@/components/AuthGuard";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import GuardianFormModal from "@/components/GuardianFormModal";
import LinkStudentModal from "@/components/LinkStudentModal";

function GuardianDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const { addToast } = useToast();

  const [guardian, setGuardian] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState(null);
  const [unlinkLoading, setUnlinkLoading] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [{ data: gData, error: gErr }, { data: summaries, error: sErr }] =
        await Promise.all([
          supabase.from("guardians").select("*").eq("id", id).single(),
          getGuardianChildSummaries(id),
        ]);

      if (gErr || !gData) {
        setNotFound(true);
        return;
      }
      if (sErr) throw sErr;

      setGuardian(gData);
      setChildren(summaries || []);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUnlink() {
    if (!unlinkTarget) return;
    setUnlinkLoading(true);
    const { error: err } = await unlinkGuardianStudent(unlinkTarget.link_id);
    setUnlinkLoading(false);
    setUnlinkTarget(null);
    if (err) {
      addToast("تعذر فك الربط", "error");
    } else {
      addToast("تم فك ربط الطالب", "success");
      load();
    }
  }

  if (notFound) {
    return (
      <EmptyState
        title="ولي الأمر غير موجود"
        description="ربما تم حذفه أو الرابط غير صحيح."
        actionLabel="← رجوع لأولياء الأمور"
        onAction={() => router.push("/guardians")}
      />
    );
  }

  return (
    <div>
      <button
        onClick={() => router.push("/guardians")}
        className="text-sm text-mist-400 hover:text-gold-400 mb-5 transition-colors"
      >
        → رجوع لأولياء الأمور
      </button>

      {error && (
        <div className="mb-6 border border-rust-500/30 bg-rust-100 text-rust-500 rounded-xl px-5 py-4 text-sm">
          حصل خطأ في تحميل بيانات ولي الأمر.
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-9 w-48" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display font-bold text-3xl text-parchment-100 glow-text-gold">
                  {guardian.name}
                </h1>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    guardian.is_active
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-rust-100 text-rust-500 border-rust-500/20"
                  }`}
                >
                  {guardian.is_active ? "نشط" : "متوقف"}
                </span>
              </div>
              <p className="text-mist-400 text-sm mt-1.5">
                <span dir="ltr">{guardian.phone || "بدون هاتف"}</span>
                {" · "}
                {children.length} أبناء
                {guardian.email ? ` · ${guardian.email}` : ""}
              </p>
              {guardian.address && (
                <p className="text-mist-500 text-xs mt-1">{guardian.address}</p>
              )}
              {guardian.notes && (
                <p className="text-mist-500 text-xs mt-1">{guardian.notes}</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setLinkOpen(true)}
                className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-4 py-2 rounded-lg text-sm font-bold"
              >
                + ربط طالب
              </button>
              <button
                onClick={() => setEditOpen(true)}
                className="bg-navy-800 border border-navy-600 hover:border-gold-500/40 text-parchment-100 px-3 py-2 rounded-lg text-sm"
              >
                تعديل
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl text-parchment-100">الأبناء</h2>
          </div>

          {children.length === 0 ? (
            <EmptyState
              title="لا يوجد أبناء مرتبطون"
              description="اربط طالباً واحداً على الأقل لعرض التقارير الأكاديمية."
              actionLabel="+ ربط طالب"
              onAction={() => setLinkOpen(true)}
            />
          ) : (
            <div className="space-y-5 mb-10">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="bg-navy-800/70 border border-navy-600 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <Link
                        href={`/students/${child.id}`}
                        className="font-display font-bold text-lg text-parchment-100 hover:text-gold-400"
                      >
                        {child.name}
                      </Link>
                      <p className="text-xs text-mist-500 mt-1">
                        {child.halaqat?.name || "بدون حلقة"}
                        {child.halaqat?.teacher_name
                          ? ` · المحفظ: ${child.halaqat.teacher_name}`
                          : ""}
                        {" · "}
                        {child.is_active ? "طالب نشط" : "طالب متوقف"}
                        {child.is_primary ? " · ولي أمر أساسي" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/students/${child.id}`}
                        className="text-xs px-3 py-1.5 rounded-lg bg-navy-700 text-gold-400"
                      >
                        ملف الطالب
                      </Link>
                      <button
                        onClick={() => setUnlinkTarget(child)}
                        className="text-xs px-3 py-1.5 rounded-lg text-mist-400 hover:text-rust-500"
                      >
                        فك الربط
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Metric
                      label="نسبة الحضور"
                      value={
                        child.attendance.percentage != null
                          ? `${child.attendance.percentage}%`
                          : "—"
                      }
                      sub={`${child.attendance.present} حضور / ${child.attendance.absent} غياب`}
                    />
                    <Metric
                      label="التسميع"
                      value={
                        child.memorization.avgRating != null
                          ? `${child.memorization.avgRating}/5`
                          : "—"
                      }
                      sub={`${child.memorization.sessions} جلسة`}
                    />
                    <Metric
                      label="المراجعة"
                      value={
                        child.revision.avgMastery != null
                          ? `${child.revision.avgMastery}/5`
                          : "—"
                      }
                      sub={`${child.revision.sessions} جلسة`}
                    />
                    <Metric
                      label="الاشتراك"
                      value={child.subscription.paidThisMonth ? "مدفوع" : "غير مدفوع"}
                      sub={child.subscription.currentMonth}
                      accent={child.subscription.paidThisMonth ? "emerald" : "rust"}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <RecentBox
                      title="آخر تسميع"
                      text={
                        child.memorization.latest
                          ? `${child.memorization.latest.surah_name} (${child.memorization.latest.from_ayah}-${child.memorization.latest.to_ayah}) · تقييم ${child.memorization.latest.rating}/5`
                          : "لا يوجد"
                      }
                    />
                    <RecentBox
                      title="آخر مراجعة"
                      text={
                        child.revision.latest
                          ? `${child.revision.latest.surah_name} · إتقان ${child.revision.latest.mastery_level}/5`
                          : "لا يوجد"
                      }
                    />
                    <RecentBox
                      title="آخر اختبار"
                      text={
                        child.exams.latest
                          ? `${child.exams.latest.exam_name} · ${
                              child.exams.latest.total_score != null
                                ? `${child.exams.latest.total_score}%`
                                : child.exams.latest.grade || "—"
                            }`
                          : "لا يوجد"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {children.length > 0 && (
            <div className="bg-navy-800/40 border border-navy-700/70 rounded-2xl p-6">
              <h2 className="font-display font-bold text-xl text-parchment-100 mb-4">
                تقارير مجمعة
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Metric
                  label="إجمالي أيام الحضور"
                  value={children.reduce((s, c) => s + c.attendance.present, 0)}
                />
                <Metric
                  label="إجمالي أيام الغياب"
                  value={children.reduce((s, c) => s + c.attendance.absent, 0)}
                  accent="rust"
                />
                <Metric
                  label="جلسات التسميع"
                  value={children.reduce((s, c) => s + c.memorization.sessions, 0)}
                  accent="gold"
                />
                <Metric
                  label="عدد الاختبارات"
                  value={children.reduce((s, c) => s + c.exams.total, 0)}
                />
              </div>
            </div>
          )}

          <GuardianFormModal
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onSaved={load}
            editingGuardian={guardian}
          />

          <LinkStudentModal
            open={linkOpen}
            onClose={() => setLinkOpen(false)}
            onSaved={load}
            guardianId={id}
            linkedStudentIds={children.map((c) => c.id)}
          />

          <ConfirmDialog
            open={!!unlinkTarget}
            title="فك ربط الطالب"
            message={`هل تريد فك ربط "${unlinkTarget?.name}" عن ولي الأمر؟`}
            confirmLabel="فك الربط"
            danger
            loading={unlinkLoading}
            onConfirm={handleUnlink}
            onCancel={() => setUnlinkTarget(null)}
          />
        </>
      )}
    </div>
  );
}

function Metric({ label, value, sub, accent }) {
  const valueClass =
    accent === "emerald"
      ? "text-emerald-500"
      : accent === "rust"
        ? "text-rust-500"
        : accent === "gold"
          ? "text-gold-400"
          : "text-parchment-100";
  return (
    <div className="bg-navy-900/70 border border-navy-700 rounded-xl p-3.5">
      <p className="text-mist-500 text-xs mb-1">{label}</p>
      <p className={`font-display text-xl font-bold ${valueClass}`}>{value}</p>
      {sub && <p className="text-[11px] text-mist-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function RecentBox({ title, text }) {
  return (
    <div className="rounded-xl border border-navy-700 bg-navy-900/50 p-3">
      <p className="text-mist-500 mb-1">{title}</p>
      <p className="text-parchment-100 leading-relaxed">{text}</p>
    </div>
  );
}

export default function GuardianDetailPage() {
  return (
    <AuthGuard>
      <GuardianDetailContent />
    </AuthGuard>
  );
}
