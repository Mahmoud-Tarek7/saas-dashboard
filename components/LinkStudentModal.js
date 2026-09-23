"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { linkGuardianStudent } from "@/lib/guardians";
import { useToast } from "@/components/ToastProvider";

export default function LinkStudentModal({ open, onClose, onSaved, guardianId, linkedStudentIds = [] }) {
  const { addToast } = useToast();
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [relationship, setRelationship] = useState("parent");
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStudentId("");
    setRelationship("parent");
    setIsPrimary(false);
    setError("");
    setLoading(true);

    const linkedKey = linkedStudentIds.join(",");

    supabase
      .from("students")
      .select("id, name, is_active, halaqat(name)")
      .eq("is_active", true)
      .order("name")
      .then(({ data, error: err }) => {
        if (err) {
          setError("تعذر تحميل الطلاب");
        } else {
          const linked = new Set(linkedKey ? linkedKey.split(",") : []);
          setStudents((data || []).filter((s) => !linked.has(s.id)));
        }
        setLoading(false);
      });
  }, [open, linkedStudentIds.join(",")]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!studentId) {
      setError("اختر الطالب");
      return;
    }
    setSaving(true);
    setError("");

    const { error: linkErr } = await linkGuardianStudent({
      guardian_id: guardianId,
      student_id: studentId,
      relationship,
      is_primary: isPrimary,
    });

    setSaving(false);

    if (linkErr) {
      if (linkErr.code === "23505") {
        addToast("هذا الربط موجود مسبقاً أو يوجد ولي أمر أساسي آخر", "error");
      } else {
        addToast("حصل خطأ في الربط، حاول تاني", "error");
      }
      return;
    }

    addToast("تم ربط الطالب بولي الأمر", "success");
    onSaved();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy-950/70 backdrop-blur-sm px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-navy-800 border border-navy-600 rounded-2xl p-6 max-w-md w-full space-y-4"
      >
        <h3 className="font-display font-bold text-lg text-parchment-100">ربط طالب</h3>

        {loading ? (
          <p className="text-mist-400 text-sm">جاري التحميل...</p>
        ) : students.length === 0 ? (
          <p className="text-mist-400 text-sm">لا يوجد طلاب متاحون للربط.</p>
        ) : (
          <>
            <div>
              <label className="block text-sm text-mist-400 mb-2">الطالب</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
              >
                <option value="">اختر الطالب</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.halaqat?.name ? ` — ${s.halaqat.name}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-mist-400 mb-2">صلة القرابة</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
              >
                <option value="parent">ولي أمر / أب أو أم</option>
                <option value="father">أب</option>
                <option value="mother">أم</option>
                <option value="guardian">وصي</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-parchment-100 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded border-navy-600"
              />
              تعيين كولي أمر أساسي لهذا الطالب
            </label>
          </>
        )}

        {error && <p className="text-rust-500 text-xs">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || loading || students.length === 0}
            className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-6 py-2.5 rounded-lg text-sm font-bold disabled:opacity-60"
          >
            {saving ? "جاري الربط..." : "ربط"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm text-mist-400 hover:text-parchment-100"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
