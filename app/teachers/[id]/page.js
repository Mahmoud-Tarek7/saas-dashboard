"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getTeacherById, setTeacherActive } from "@/lib/teachers";
import AuthGuard from "@/components/AuthGuard";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import TeacherFormModal from "@/components/TeacherFormModal";

function TeacherDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const { addToast } = useToast();

  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const { data, error: err } = await getTeacherById(id);
      if (err || !data) {
        setNotFound(true);
        return;
      }
      setTeacher(data);
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

  async function handleToggleActive() {
    if (!teacher) return;
    setConfirmLoading(true);
    const nextActive = !teacher.is_active;
    const { error: toggleErr } = await setTeacherActive(
      teacher.id,
      teacher.name,
      nextActive
    );
    setConfirmLoading(false);
    setConfirmOpen(false);

    if (toggleErr) {
      addToast("حصل خطأ أثناء تحديث حالة المحفظ", "error");
    } else {
      addToast(
        nextActive
          ? `تم إعادة تفعيل المحفظ: ${teacher.name}`
          : `تم إيقاف المحفظ: ${teacher.name}`,
        "success"
      );
      load();
    }
  }

  if (notFound) {
    return (
      <EmptyState
        title="المحفظ غير موجود"
        description="ربما تم نقله أو الرابط غير صحيح."
        actionLabel="← رجوع لقائمة المحفظين"
        onAction={() => router.push("/teachers")}
      />
    );
  }

  const halaqatList = teacher?.halaqat || [];

  return (
    <div>
      <button
        onClick={() => router.push("/teachers")}
        className="text-sm text-mist-400 hover:text-gold-400 mb-5 transition-colors flex items-center gap-1"
      >
        <span>→</span>
        <span>رجوع لقائمة المحفظين</span>
      </button>

      {error && (
        <div className="mb-6 border border-rust-500/30 bg-rust-100 text-rust-500 rounded-xl px-5 py-4 text-sm">
          حصل خطأ في تحميل بيانات المحفظ.
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 lg:col-span-2 rounded-2xl" />
          </div>
        </div>
      ) : teacher ? (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display font-bold text-3xl text-parchment-100 glow-text-gold">
                  {teacher.name}
                </h1>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    teacher.is_active
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-rust-100 text-rust-500 border-rust-500/20"
                  }`}
                >
                  {teacher.is_active ? "نشط" : "متوقف"}
                </span>
              </div>
              <p className="text-mist-400 text-sm mt-2">
                تاريخ التسجيل:{" "}
                {new Date(teacher.created_at).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="bg-navy-800 border border-navy-600 hover:border-gold-500/40 text-parchment-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                تعديل البيانات
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                className="bg-navy-800 border border-navy-600 hover:border-rust-500 text-rust-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {teacher.is_active ? "إيقاف المحفظ" : "تفعيل المحفظ"}
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Info Card */}
            <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-6 space-y-4">
              <h2 className="font-display font-bold text-lg text-parchment-100 border-b border-navy-700 pb-3">
                البيانات الشخصية
              </h2>

              <div>
                <p className="text-xs text-mist-500">رقم الهاتف</p>
                {teacher.phone ? (
                  <a
                    href={`tel:${teacher.phone}`}
                    dir="ltr"
                    className="text-gold-400 hover:underline font-mono text-sm inline-block mt-0.5"
                  >
                    {teacher.phone}
                  </a>
                ) : (
                  <p className="text-mist-400 text-sm mt-0.5">—</p>
                )}
              </div>

              <div>
                <p className="text-xs text-mist-500">البريد الإلكتروني</p>
                {teacher.email ? (
                  <a
                    href={`mailto:${teacher.email}`}
                    dir="ltr"
                    className="text-gold-400 hover:underline text-sm inline-block mt-0.5"
                  >
                    {teacher.email}
                  </a>
                ) : (
                  <p className="text-mist-400 text-sm mt-0.5">—</p>
                )}
              </div>

              <div>
                <p className="text-xs text-mist-500">التخصص / الإجازة</p>
                <p className="text-parchment-100 text-sm mt-0.5 font-medium">
                  {teacher.specialization || "لم يتم تحديد تخصص"}
                </p>
              </div>

              <div>
                <p className="text-xs text-mist-500">ملاحظات إضافية</p>
                <p className="text-mist-300 text-sm mt-0.5 whitespace-pre-wrap">
                  {teacher.notes || "لا توجد ملاحظات مسجلة."}
                </p>
              </div>
            </div>

            {/* Assigned Halaqat */}
            <div className="lg:col-span-2 bg-navy-800/70 border border-navy-600 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-navy-700 pb-3">
                <h2 className="font-display font-bold text-lg text-parchment-100">
                  الحلقات المسندة
                </h2>
                <span className="text-xs px-2.5 py-1 rounded-full bg-navy-900 border border-navy-700 text-gold-400 font-bold">
                  {halaqatList.length} حلقة
                </span>
              </div>

              {halaqatList.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-mist-400 text-sm mb-3">
                    لا توجد حلقات مسندة لهذا المحفظ حاليًا.
                  </p>
                  <Link
                    href="/halaqat"
                    className="text-xs px-4 py-2 rounded-lg bg-navy-800 border border-navy-600 text-gold-400 hover:bg-navy-700 transition-colors inline-block"
                  >
                    الانتقال للحلقات لإسناد حلقة
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-navy-700 border border-navy-700 rounded-xl overflow-hidden">
                  {halaqatList.map((h) => (
                    <div
                      key={h.id}
                      className="p-4 flex items-center justify-between hover:bg-navy-800/80 transition-colors gap-3 flex-wrap"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              h.type === "intensive" ? "bg-gold-500" : "bg-emerald-500"
                            }`}
                          />
                          <Link
                            href={`/halaqat/${h.id}`}
                            className="font-medium text-parchment-100 hover:text-gold-400 transition-colors"
                          >
                            {h.name}
                          </Link>
                          {!h.is_active && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rust-100 text-rust-500 border border-rust-500/20">
                              متوقفة
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-mist-500 mt-1">
                          {h.section === "women" ? "قسم النساء" : "قسم الرجال"}
                          {" · "}
                          {h.type === "intensive" ? "حلقة مكثفة" : "حلقة عادية"}
                        </p>
                      </div>

                      <Link
                        href={`/halaqat/${h.id}`}
                        className="text-xs px-3 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-gold-400 transition-colors"
                      >
                        عرض تفاصيل الحلقة ←
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit modal */}
      <TeacherFormModal
        open={editOpen}
        editingTeacher={teacher}
        onClose={() => setEditOpen(false)}
        onSaved={load}
      />

      {/* Confirm toggle active */}
      <ConfirmDialog
        open={confirmOpen}
        title={teacher?.is_active ? "إيقاف المحفظ" : "إعادة تفعيل المحفظ"}
        message={
          teacher?.is_active
            ? `هل أنت متأكد من إيقاف المحفظ "${teacher?.name}"؟`
            : `هل تريد إعادة تفعيل المحفظ "${teacher?.name}"؟`
        }
        confirmLabel={teacher?.is_active ? "إيقاف" : "تفعيل"}
        danger={teacher?.is_active}
        loading={confirmLoading}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

export default function TeacherDetailPage() {
  return (
    <AuthGuard>
      <TeacherDetailContent />
    </AuthGuard>
  );
}
