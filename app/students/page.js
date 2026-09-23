"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { setStudentActive } from "@/lib/students";
import { getMonthKey } from "@/lib/date";
import AuthGuard from "@/components/AuthGuard";
import { useToast } from "@/components/ToastProvider";
import { SkeletonRow } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import StudentFormModal from "@/components/StudentFormModal";

function StudentsContent() {
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [students, setStudents] = useState([]);
  const [halaqat, setHalaqat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [halaqaFilter, setHalaqaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [subFilter, setSubFilter] = useState("all"); // all | paid | unpaid (الشهر الحالي)
  const [sortAsc, setSortAsc] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      let query = supabase.from("students").select("*, halaqat(name)");

      if (statusFilter === "active") query = query.eq("is_active", true);
      if (statusFilter === "inactive") query = query.eq("is_active", false);
      if (halaqaFilter !== "all") query = query.eq("halaqa_id", halaqaFilter);
      if (search.trim()) {
        // بنحط القيمة بين علامتي اقتباس عشان لو فيها فاصلة أو قوس ما تكسرش صيغة .or() في PostgREST
        const safe = search.trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        query = query.or(`name.ilike."%${safe}%",parent_phone.ilike."%${safe}%"`);
      }
      query = query.order("name", { ascending: sortAsc });

      const month = getMonthKey();

      const [
        { data: studentsData, error: studentsErr },
        { data: halaqatData },
        { data: subsData },
      ] = await Promise.all([
        query,
        supabase.from("halaqat").select("*").order("name"),
        supabase.from("subscriptions").select("student_id").eq("month", month),
      ]);

      if (studentsErr) throw studentsErr;

      const paidIds = new Set((subsData || []).map((s) => s.student_id));
      let filtered = studentsData || [];
      if (subFilter === "paid") filtered = filtered.filter((s) => paidIds.has(s.id));
      if (subFilter === "unpaid") filtered = filtered.filter((s) => !paidIds.has(s.id));

      setStudents(filtered);
      setHalaqat(halaqatData || []);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [search, halaqaFilter, statusFilter, subFilter, sortAsc]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(load, 300); // debounce بسيط للبحث
    return () => clearTimeout(t);
  }, [load]);

  // دعم فتح النموذج تلقائيًا من رابط خارجي: ?new=1 أو ?edit=<id>
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditingStudent(null);
      setModalOpen(true);
      router.replace("/students");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && students.length > 0) {
      const target = students.find((s) => s.id === editId);
      if (target) {
        setEditingStudent(target);
        setModalOpen(true);
        router.replace("/students");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  async function handleToggleActive() {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    const { error } = await setStudentActive(
      confirmTarget.id,
      confirmTarget.name,
      !confirmTarget.is_active
    );
    setConfirmLoading(false);
    setConfirmTarget(null);
    if (error) {
      addToast("حصل خطأ، حاول تاني", "error");
    } else {
      addToast(
        confirmTarget.is_active ? "تم إيقاف الطالب" : "تم إعادة تفعيل الطالب",
        "success"
      );
      load();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display font-bold text-3xl text-parchment-100 glow-text-gold">
          الطلاب
        </h1>
        <button
          onClick={() => {
            setEditingStudent(null);
            setModalOpen(true);
          }}
          className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
        >
          + إضافة طالب
        </button>
      </div>

      {/* أدوات البحث والفلترة */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو رقم الهاتف..."
          className="flex-1 min-w-[200px] rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 text-sm"
        />
        <select
          value={halaqaFilter}
          onChange={(e) => setHalaqaFilter(e.target.value)}
          className="rounded-lg border border-navy-600 bg-navy-900 px-3.5 py-2.5 text-parchment-100 outline-none text-sm"
        >
          <option value="all">كل الحلقات</option>
          {halaqat.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-navy-600 bg-navy-900 px-3.5 py-2.5 text-parchment-100 outline-none text-sm"
        >
          <option value="active">نشط</option>
          <option value="inactive">متوقف</option>
          <option value="all">الكل</option>
        </select>
        <select
          value={subFilter}
          onChange={(e) => setSubFilter(e.target.value)}
          className="rounded-lg border border-navy-600 bg-navy-900 px-3.5 py-2.5 text-parchment-100 outline-none text-sm"
        >
          <option value="all">كل حالات الاشتراك</option>
          <option value="paid">دافع الشهر ده</option>
          <option value="unpaid">متأخر الشهر ده</option>
        </select>
        <button
          onClick={() => setSortAsc((v) => !v)}
          className="rounded-lg border border-navy-600 bg-navy-900 px-3.5 py-2.5 text-mist-400 hover:text-parchment-100 text-sm"
        >
          {sortAsc ? "أ ← ي" : "ي ← أ"}
        </button>
      </div>

      {error && (
        <div className="mb-6 border border-rust-500/30 bg-rust-100 text-rust-500 rounded-xl px-5 py-4 text-sm">
          حصل خطأ في تحميل الطلاب. حاول تحديث الصفحة.
        </div>
      )}

      {loading ? (
        <div className="border border-navy-600 rounded-2xl bg-navy-800/50 divide-y divide-navy-700 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          title="لا يوجد طلاب مطابقين"
          description="جرّب تغيير الفلاتر، أو أضف طالب جديد."
          actionLabel="+ إضافة طالب"
          onAction={() => {
            setEditingStudent(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="divide-y divide-navy-700 border border-navy-600 rounded-2xl bg-navy-800/50 overflow-hidden">
          {students.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-navy-800 transition-colors flex-wrap gap-2"
            >
              <Link href={`/students/${s.id}`} className="flex-1 min-w-[140px]">
                <div className="flex items-center gap-2.5">
                  <p className="text-parchment-100 font-medium truncate">{s.name}</p>
                  {!s.is_active && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rust-100 text-rust-500 border border-rust-500/20 shrink-0">
                      متوقف
                    </span>
                  )}
                </div>
                <p className="text-xs text-mist-500 mt-0.5">
                  {s.halaqat?.name} {s.parent_phone ? `· ${s.parent_phone}` : ""}
                </p>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditingStudent(s);
                    setModalOpen(true);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg text-mist-400 hover:text-gold-400 hover:bg-navy-700 transition-colors"
                >
                  تعديل
                </button>
                <button
                  onClick={() => setConfirmTarget(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    s.is_active
                      ? "text-mist-400 hover:text-rust-500 hover:bg-navy-700"
                      : "text-mist-400 hover:text-emerald-500 hover:bg-navy-700"
                  }`}
                >
                  {s.is_active ? "إيقاف" : "تفعيل"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <StudentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        halaqat={halaqat}
        editingStudent={editingStudent}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.is_active ? "إيقاف الطالب" : "إعادة تفعيل الطالب"}
        message={
          confirmTarget?.is_active
            ? `هل تريد إيقاف "${confirmTarget?.name}"؟ لن يظهر في الحضور اليومي وسجلاته السابقة تبقى محفوظة.`
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

export default function StudentsPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<p className="text-mist-400">جاري التحميل...</p>}>
        <StudentsContent />
      </Suspense>
    </AuthGuard>
  );
}
