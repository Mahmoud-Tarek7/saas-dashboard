"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getTeachers, setTeacherActive } from "@/lib/teachers";
import AuthGuard from "@/components/AuthGuard";
import { useToast } from "@/components/ToastProvider";
import { SkeletonRow } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import TeacherFormModal from "@/components/TeacherFormModal";

function TeachersContent() {
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [teachers, setTeachers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [{ data: teachersData, error: tErr }, { data: statsData, error: sErr }] =
        await Promise.all([
          getTeachers({ search, status: statusFilter }),
          supabase.from("teachers").select("id, is_active"),
        ]);

      if (tErr) throw tErr;
      if (sErr) throw sErr;

      setTeachers(teachersData || []);

      const all = statsData || [];
      setStats({
        total: all.length,
        active: all.filter((t) => t.is_active).length,
        inactive: all.filter((t) => !t.is_active).length,
      });
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditingTeacher(null);
      setModalOpen(true);
      router.replace("/teachers");
    }
  }, [searchParams, router]);

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && teachers.length > 0) {
      const target = teachers.find((t) => t.id === editId);
      if (target) {
        setEditingTeacher(target);
        setModalOpen(true);
        router.replace("/teachers");
      }
    }
  }, [teachers, searchParams, router]);

  async function handleToggleActive() {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    const nextActive = !confirmTarget.is_active;
    const { error: toggleErr } = await setTeacherActive(
      confirmTarget.id,
      confirmTarget.name,
      nextActive
    );
    setConfirmLoading(false);
    setConfirmTarget(null);

    if (toggleErr) {
      addToast("حصل خطأ أثناء تحديث حالة المحفظ", "error");
    } else {
      addToast(
        nextActive
          ? `تم إعادة تفعيل المحفظ: ${confirmTarget.name}`
          : `تم إيقاف المحفظ: ${confirmTarget.name}`,
        "success"
      );
      load();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-3xl text-parchment-100 glow-text-gold">
            المحفظون
          </h1>
          <p className="text-mist-400 text-sm mt-1">
            إدارة الكادر التعليمي ومحفظي الحلقات ومتابعة الحلقات المسندة إليهم
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTeacher(null);
            setModalOpen(true);
          }}
          className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
        >
          + إضافة محفظ
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-5">
          <p className="text-mist-400 text-sm mb-1">إجمالي المحفظين</p>
          <p className="font-display text-2xl font-bold text-parchment-100">{stats.total}</p>
        </div>
        <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-5 glow-emerald">
          <p className="text-mist-400 text-sm mb-1">المحفظون النشطون</p>
          <p className="font-display text-2xl font-bold text-emerald-500">{stats.active}</p>
        </div>
        <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-5">
          <p className="text-mist-400 text-sm mb-1">غير النشطين</p>
          <p className="font-display text-2xl font-bold text-mist-400">{stats.inactive}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث باسم المحفظ أو رقم الهاتف..."
          className="flex-1 min-w-[200px] rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-navy-600 bg-navy-900 px-3.5 py-2.5 text-parchment-100 outline-none text-sm"
        >
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">متوقف</option>
        </select>
      </div>

      {error && (
        <div className="mb-6 border border-rust-500/30 bg-rust-100 text-rust-500 rounded-xl px-5 py-4 text-sm">
          حصل خطأ في تحميل بيانات المحفظين. حاول تحديث الصفحة.
        </div>
      )}

      {loading ? (
        <div className="border border-navy-600 rounded-2xl bg-navy-800/50 divide-y divide-navy-700 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : teachers.length === 0 ? (
        <EmptyState
          title="لا يوجد محفظون مسجلون بعد"
          description="أضف أول محفظ في المركز ثم ابدأ بإسناد الحلقات إليه."
          actionLabel="+ إضافة محفظ"
          onAction={() => {
            setEditingTeacher(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block border border-navy-600 rounded-2xl bg-navy-800/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-navy-900/60 text-mist-400 text-xs">
                <tr>
                  <th className="text-right font-medium px-5 py-3">المحفظ</th>
                  <th className="text-right font-medium px-5 py-3">الهاتف</th>
                  <th className="text-right font-medium px-5 py-3">التخصص / الإجازة</th>
                  <th className="text-right font-medium px-5 py-3">الحلقات المسندة</th>
                  <th className="text-right font-medium px-5 py-3">الحالة</th>
                  <th className="text-right font-medium px-5 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700">
                {teachers.map((t) => {
                  const halaqatList = t.halaqat || [];
                  return (
                    <tr key={t.id} className="hover:bg-navy-800 transition-colors">
                      <td className="px-5 py-4">
                        <Link
                          href={`/teachers/${t.id}`}
                          className="font-medium text-parchment-100 hover:text-gold-400"
                        >
                          {t.name}
                        </Link>
                        {t.email && (
                          <p className="text-xs text-mist-500 mt-0.5" dir="ltr">
                            {t.email}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-mist-400" dir="ltr">
                        {t.phone || "—"}
                      </td>
                      <td className="px-5 py-4 text-mist-300">
                        {t.specialization ? (
                          <span className="text-xs px-2.5 py-1 rounded-md bg-navy-900 border border-navy-700 text-mist-200">
                            {t.specialization}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-parchment-100 font-semibold">
                          {halaqatList.length}
                        </span>
                        {halaqatList.length > 0 && (
                          <p className="text-xs text-mist-500 mt-0.5 truncate max-w-[220px]">
                            {halaqatList.map((h) => h.name).join(" · ")}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            t.is_active
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-rust-100 text-rust-500 border-rust-500/20"
                          }`}
                        >
                          {t.is_active ? "نشط" : "متوقف"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/teachers/${t.id}`}
                            className="text-xs px-3 py-1.5 rounded-lg text-mist-400 hover:text-gold-400 hover:bg-navy-700 transition-colors"
                          >
                            عرض
                          </Link>
                          <button
                            onClick={() => {
                              setEditingTeacher(t);
                              setModalOpen(true);
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg text-mist-400 hover:text-gold-400 hover:bg-navy-700 transition-colors"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => setConfirmTarget(t)}
                            className="text-xs px-3 py-1.5 rounded-lg text-mist-400 hover:text-rust-500 hover:bg-navy-700 transition-colors"
                          >
                            {t.is_active ? "إيقاف" : "تفعيل"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {teachers.map((t) => {
              const halaqatList = t.halaqat || [];
              return (
                <div
                  key={t.id}
                  className="border border-navy-600 rounded-2xl bg-navy-800/50 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/teachers/${t.id}`}
                        className="font-medium text-parchment-100 hover:text-gold-400"
                      >
                        {t.name}
                      </Link>
                      <p className="text-xs text-mist-500 mt-1" dir="ltr">
                        {t.phone || "بدون هاتف"}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${
                        t.is_active
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-rust-100 text-rust-500 border-rust-500/20"
                      }`}
                    >
                      {t.is_active ? "نشط" : "متوقف"}
                    </span>
                  </div>

                  {t.specialization && (
                    <p className="text-xs text-mist-300">
                      التخصص: {t.specialization}
                    </p>
                  )}

                  <p className="text-xs text-mist-400">
                    {halaqatList.length} حلقات مسندة
                    {halaqatList.length > 0
                      ? ` · ${halaqatList.map((h) => h.name).join(" · ")}`
                      : ""}
                  </p>

                  <div className="flex items-center gap-2 pt-2 border-t border-navy-700">
                    <Link
                      href={`/teachers/${t.id}`}
                      className="text-xs px-3 py-1.5 rounded-lg bg-navy-700 text-gold-400"
                    >
                      عرض التفاصيل
                    </Link>
                    <button
                      onClick={() => {
                        setEditingTeacher(t);
                        setModalOpen(true);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-navy-700 text-mist-200"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => setConfirmTarget(t)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-navy-700 text-rust-500"
                    >
                      {t.is_active ? "إيقاف" : "تفعيل"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Toggle active confirmation */}
      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={confirmTarget?.is_active ? "إيقاف المحفظ" : "إعادة تفعيل المحفظ"}
        message={
          confirmTarget?.is_active
            ? `هل أنت متأكد من إيقاف المحفظ "${confirmTarget?.name}"؟ لن يظهر في قائمة المحفظين النشطين عند إنشاء حلقات جديدة.`
            : `هل تريد تفعيل المحفظ "${confirmTarget?.name}" مجددًا؟`
        }
        confirmLabel={confirmTarget?.is_active ? "إيقاف" : "تفعيل"}
        danger={confirmTarget?.is_active}
        loading={confirmLoading}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmTarget(null)}
      />

      {/* Teacher modal */}
      <TeacherFormModal
        open={modalOpen}
        editingTeacher={editingTeacher}
        onClose={() => {
          setModalOpen(false);
          setEditingTeacher(null);
        }}
        onSaved={load}
      />
    </div>
  );
}

export default function TeachersPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="p-6">
            <SkeletonRow />
          </div>
        }
      >
        <TeachersContent />
      </Suspense>
    </AuthGuard>
  );
}
