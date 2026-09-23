"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { createHalaqa, updateHalaqa } from "@/lib/halaqat";
import { useToast } from "@/components/ToastProvider";

const emptyForm = {
  name: "",
  teacher_id: "",
  teacher_name: "",
  type: "regular",
  section: "men",
};

/**
 * نموذج إنشاء/تعديل حلقة - مكوّن مشترك يُستخدم في:
 * - صفحة إدارة الحلقات (app/halaqat/page.js)
 * - صفحة تفاصيل الحلقة (app/halaqat/[id]/page.js)
 */
export default function HalaqaFormModal({ open, onClose, onSaved, editingHalaqa }) {
  const { addToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [teachers, setTeachers] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    // جلب قائمة المحفظين النشطين للاختيار منهم
    async function fetchTeachers() {
      const { data } = await supabase
        .from("teachers")
        .select("id, name, is_active")
        .order("name");
      setTeachers(data || []);
    }
    fetchTeachers();

    if (editingHalaqa) {
      setForm({
        name: editingHalaqa.name || "",
        teacher_id: editingHalaqa.teacher_id || "",
        teacher_name: editingHalaqa.teacher_name || "",
        type: editingHalaqa.type || "regular",
        section: editingHalaqa.section || "men",
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [editingHalaqa, open]);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "اسم الحلقة مطلوب";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      teacher_id: form.teacher_id || null,
      type: form.type,
      section: form.section,
    };

    const { error } = editingHalaqa
      ? await updateHalaqa(editingHalaqa.id, payload)
      : await createHalaqa(payload);

    setSaving(false);

    if (error) {
      addToast("حصل خطأ، حاول تاني", "error");
      return;
    }

    addToast(editingHalaqa ? "تم تعديل بيانات الحلقة" : "تم إنشاء الحلقة بنجاح", "success");
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
        <h3 className="font-display font-bold text-lg text-parchment-100">
          {editingHalaqa ? "تعديل بيانات الحلقة" : "إنشاء حلقة جديدة"}
        </h3>

        <div>
          <label className="block text-sm text-mist-400 mb-2">اسم الحلقة</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 text-sm"
          />
          {errors.name && <p className="text-rust-500 text-xs mt-1.5">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm text-mist-400 mb-2">المحفظ المسند إليه</label>
          <select
            value={form.teacher_id}
            onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2.5 text-parchment-100 outline-none focus:border-gold-500 text-sm"
          >
            <option value="">-- بدون محفظ --</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {!t.is_active ? " (متوقف)" : ""}
              </option>
            ))}
          </select>
          {!form.teacher_id && form.teacher_name && (
            <p className="text-xs text-gold-400/90 mt-2 bg-gold-500/10 border border-gold-500/20 rounded-lg p-2">
              المحفظ الحالي (مسجل نصياً): <span className="font-bold text-parchment-100">{form.teacher_name}</span>
              <br />
              <span className="text-mist-400 text-[11px]">
                يمكنك اختيار محفظ من القائمة أعلاه لربط الحلقة به رسميًا.
              </span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-mist-400 mb-2">نوع الحلقة</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2.5 text-parchment-100 outline-none focus:border-gold-500 text-sm"
            >
              <option value="regular">عادية</option>
              <option value="intensive">مكثفة</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-mist-400 mb-2">القسم</label>
            <select
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2.5 text-parchment-100 outline-none focus:border-gold-500 text-sm"
            >
              <option value="men">رجال</option>
              <option value="women">نساء</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-6 py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 transition-colors"
          >
            {saving ? "جاري الحفظ..." : "حفظ"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm text-mist-400 hover:text-parchment-100 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
