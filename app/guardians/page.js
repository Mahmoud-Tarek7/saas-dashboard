"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { listGuardiansWithChildren, setGuardianActive } from "@/lib/guardians";
import AuthGuard from "@/components/AuthGuard";
import { useToast } from "@/components/ToastProvider";
import { SkeletonRow } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import GuardianFormModal from "@/components/GuardianFormModal";

function GuardiansContent() {
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const { data, error: err } = await listGuardiansWithChildren({
        search,
        status: statusFilter,
      });
      if (err) throw err;
      setGuardians(data || []);
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
      setEditing(null);
      setModalOpen(true);
      router.replace("/guardians");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = guardians.length;
    const active = guardians.filter((g) => g.is_active).length;
    const multi = guardians.filter((g) => (g.children_count || 0) > 1).length;
    return { total, active, multi };
  }, [guardians]);

  async function handleToggle() {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    const { error: err } = await setGuardianActive(confirmTarget.id, !confirmTarget.is_active);
    setConfirmLoading(false);
    setConfirmTarget(null);
    if (err) {
      addToast("حصل خطأ، حاول تاني", "error");
    } else {
      addToast(
        confirmTarget.is_active ? "تم إيقاف ولي الأمر" : "تم إعادة تفعيل ولي الأمر",
        "success"
      );
      load();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display font-bold text-3xl text-parchment-100 glow-text-gold">
          أولياء الأمور
        </h1>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
        >
          + إضافة ولي أمر
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-5">
          <p className="text-mist-400 text-sm mb-1">إجمالي أولياء الأمور</p>
          <p className="font-display text-2xl font-bold text-parchment-100">{stats.total}</p>
        </div>
        <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-5 glow-emerald">
          <p className="text-mist-400 text-sm mb-1">النشطون</p>
          <p className="font-display text-2xl font-bold text-emerald-500">{stats.active}</p>
        </div>
        <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-5">
          <p className="text-mist-400 text-sm mb-1">لديهم أكثر من طفل</p>
          <p className="font-display text-2xl font-bold text-gold-400">{stats.multi}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو رقم الهاتف..."
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
          حصل خطأ في تحميل أولياء الأمور. حاول تحديث الصفحة.
        </div>
      )}

      {loading ? (
        <div className="border border-navy-600 rounded-2xl bg-navy-800/50 divide-y divide-navy-700 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : guardians.length === 0 ? (
        <EmptyState
          title="لا يوجد أولياء أمور بعد"
          description="أضف أول ولي أمر ثم اربطه بالطلاب."
          actionLabel="+ إضافة ولي أمر"
          onAction={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block border border-navy-600 rounded-2xl bg-navy-800/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-navy-900/60 text-mist-400 text-xs">
                <tr>
                  <th className="text-right font-medium px-5 py-3">ولي الأمر</th>
                  <th className="text-right font-medium px-5 py-3">الهاتف</th>
                  <th className="text-right font-medium px-5 py-3">الأبناء</th>
                  <th className="text-right font-medium px-5 py-3">الحالة</th>
                  <th className="text-right font-medium px-5 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700">
                {guardians.map((g) => (
                  <tr key={g.id} className="hover:bg-navy-800 transition-colors">
                    <td className="px-5 py-4">
                      <Link
                        href={`/guardians/${g.id}`}
                        className="font-medium text-parchment-100 hover:text-gold-400"
                      >
                        {g.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-mist-400" dir="ltr">
                      {g.phone || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-parchment-100">{g.children_count || 0}</span>
                      {g.children_names?.length > 0 && (
                        <p className="text-xs text-mist-500 mt-0.5 truncate max-w-[220px]">
                          {g.children_names.join(" · ")}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          g.is_active
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-rust-100 text-rust-500 border-rust-500/20"
                        }`}
                      >
                        {g.is_active ? "نشط" : "متوقف"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/guardians/${g.id}`}
                          className="text-xs px-3 py-1.5 rounded-lg text-mist-400 hover:text-gold-400 hover:bg-navy-700"
                        >
                          عرض
                        </Link>
                        <button
                          onClick={() => {
                            setEditing(g);
                            setModalOpen(true);
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg text-mist-400 hover:text-gold-400 hover:bg-navy-700"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => setConfirmTarget(g)}
                          className="text-xs px-3 py-1.5 rounded-lg text-mist-400 hover:text-rust-500 hover:bg-navy-700"
                        >
                          {g.is_active ? "إيقاف" : "تفعيل"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {guardians.map((g) => (
              <div
                key={g.id}
                className="border border-navy-600 rounded-2xl bg-navy-800/50 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/guardians/${g.id}`}
                      className="font-medium text-parchment-100 hover:text-gold-400"
                    >
                      {g.name}
                    </Link>
                    <p className="text-xs text-mist-500 mt-1" dir="ltr">
                      {g.phone || "بدون هاتف"}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${
                      g.is_active
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-rust-100 text-rust-500 border-rust-500/20"
                    }`}
                  >
                    {g.is_active ? "نشط" : "متوقف"}
                  </span>
                </div>
                <p className="text-xs text-mist-400">
                  {g.children_count || 0} أبناء
                  {g.children_names?.length
                    ? ` · ${g.children_names.join(" · ")}`
                    : ""}
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/guardians/${g.id}`}
                    className="text-xs px-3 py-1.5 rounded-lg bg-navy-700 text-gold-400"
                  >
                    عرض
                  </Link>
                  <button
                    onClick={() => {
                      setEditing(g);
                      setModalOpen(true);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg text-mist-400 hover:text-gold-400"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => setConfirmTarget(g)}
                    className="text-xs px-3 py-1.5 rounded-lg text-mist-400 hover:text-rust-500"
                  >
                    {g.is_active ? "إيقاف" : "تفعيل"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <GuardianFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        editingGuardian={editing}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.is_active ? "إيقاف ولي الأمر" : "تفعيل ولي الأمر"}
        message={
          confirmTarget?.is_active
            ? `هل تريد إيقاف "${confirmTarget?.name}"؟`
            : `هل تريد إعادة تفعيل "${confirmTarget?.name}"؟`
        }
        confirmLabel={confirmTarget?.is_active ? "إيقاف" : "تفعيل"}
        danger={confirmTarget?.is_active}
        loading={confirmLoading}
        onConfirm={handleToggle}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

export default function GuardiansPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<p className="text-mist-400">جاري التحميل...</p>}>
        <GuardiansContent />
      </Suspense>
    </AuthGuard>
  );
}
