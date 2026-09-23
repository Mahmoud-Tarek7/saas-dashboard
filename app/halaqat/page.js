"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { setHalaqaActive } from "@/lib/halaqat";
import AuthGuard from "@/components/AuthGuard";
import { useToast } from "@/components/ToastProvider";
import { SkeletonRow } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import HalaqaFormModal from "@/components/HalaqaFormModal";

function HalaqatContent() {
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [halaqat, setHalaqat] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHalaqa, setEditingHalaqa] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [{ data: halaqatData, error: hErr }, { data: studentsData }] = await Promise.all([
        supabase.from("halaqat").select("*, teachers(id, name)").order("created_at"),
        supabase.from("students").select("halaqa_id").eq("is_active", true),
      ]);
      if (hErr) throw hErr;

      const countMap = {};
      (studentsData || []).forEach((s) => {
        countMap[s.halaqa_id] = (countMap[s.halaqa_id] || 0) + 1;
      });

      setHalaqat(halaqatData || []);
      setCounts(countMap);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditingHalaqa(null);
      setModalOpen(true);
      router.replace("/halaqat");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display font-bold text-3xl text-parchment-100 glow-text-gold">
          الحلقات
        </h1>
        <button
          onClick={() => {
            setEditingHalaqa(null);
            setModalOpen(true);
          }}
          className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
        >
          + إنشاء حلقة
        </button>
      </div>

      {error && (
        <div className="mb-6 border border-rust-500/30 bg-rust-100 text-rust-500 rounded-xl px-5 py-4 text-sm">
          حصل خطأ في تحميل الحلقات. حاول تحديث الصفحة.
        </div>
      )}

      {loading ? (
        <div className="border border-navy-600 rounded-2xl bg-navy-800/50 divide-y divide-navy-700 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : halaqat.length === 0 ? (
        <EmptyState
          title="لا توجد حلقات بعد"
          description="أنشئ أول حلقة عشان تقدر تسجل طلاب وحضور."
          actionLabel="+ إنشاء حلقة"
          onAction={() => {
            setEditingHalaqa(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="divide-y divide-navy-700 border border-navy-600 rounded-2xl bg-navy-800/50 overflow-hidden">
          {halaqat.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-navy-800 transition-colors flex-wrap gap-2"
            >
              <Link href={`/halaqat/${h.id}`} className="flex-1 min-w-[160px]">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      h.type === "intensive" ? "bg-gold-500" : "bg-emerald-500"
                    }`}
                  />
                  <p className="font-medium text-parchment-100 truncate">{h.name}</p>
                  {!h.is_active && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rust-100 text-rust-500 border border-rust-500/20 shrink-0">
                      متوقفة
                    </span>
                  )}
                </div>
                <p className="text-xs text-mist-500 mt-0.5">
                  {counts[h.id] || 0} طالب
                  {(h.teachers?.name || h.teacher_name) ? ` · ${h.teachers?.name || h.teacher_name}` : ""}
                  {h.section === "women" ? " · قسم النساء" : " · قسم الرجال"}
                </p>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditingHalaqa(h);
                    setModalOpen(true);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg text-mist-400 hover:text-gold-400 hover:bg-navy-700 transition-colors"
                >
                  تعديل
                </button>
                <button
                  onClick={() => setConfirmTarget(h)}
                  className="text-xs px-3 py-1.5 rounded-lg text-mist-400 hover:text-rust-500 hover:bg-navy-700 transition-colors"
                >
                  {h.is_active ? "إيقاف" : "تفعيل"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <HalaqaFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        editingHalaqa={editingHalaqa}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.is_active ? "إيقاف الحلقة" : "إعادة تفعيل الحلقة"}
        message={
          confirmTarget?.is_active
            ? `هل تريد إيقاف "${confirmTarget?.name}"؟ الطلاب المسجلين فيها هيفضلوا مرتبطين بيها.`
            : `هل تريد إعادة تفعيل "${confirmTarget?.name}"؟`
        }
        confirmLabel={confirmTarget?.is_active ? "إيقاف" : "تفعيل"}
        danger={confirmTarget?.is_active}
        loading={confirmLoading}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

export default function HalaqatPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<p className="text-mist-400">جاري التحميل...</p>}>
        <HalaqatContent />
      </Suspense>
    </AuthGuard>
  );
}
