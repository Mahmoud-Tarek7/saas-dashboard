"use client";

import { useEffect, useState } from "react";
import { createTeacher, updateTeacher } from "@/lib/teachers";
import { useToast } from "@/components/ToastProvider";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  specialization: "",
  notes: "",
  is_active: true,
};

export default function TeacherFormModal({ open, onClose, onSaved, editingTeacher }) {
  const { addToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingTeacher) {
      setForm({
        name: editingTeacher.name || "",
        phone: editingTeacher.phone || "",
        email: editingTeacher.email || "",
        specialization: editingTeacher.specialization || "",
        notes: editingTeacher.notes || "",
        is_active: editingTeacher.is_active !== false,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [editingTeacher, open]);

  function validate() {
    const e = {};
    if (!form.name.trim()) {
      e.name = "اسم المحفظ مطلوب";
    }
    if (form.email && form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = "البريد الإلكتروني غير صحيح";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      specialization: form.specialization.trim() || null,
      notes: form.notes.trim() || null,
      is_active: form.is_active,
    };

    const { error } = editingTeacher
      ? await updateTeacher(editingTeacher.id, payload)
      : await createTeacher(payload);

    setSaving(false);

    if (error) {
      addToast("حصل خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى", "error");
      return;
    }

    addToast(
      editingTeacher ? "تم تعديل بيانات المحفظ بنجاح" : "تم إضافة المحفظ بنجاح",
      "success"
    );
    onSaved();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy-950/70 backdrop-blur-sm px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-navy-800 border border-navy-600 rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-navy-700 pb-3">
          <h3 className="font-display font-bold text-lg text-parchment-100">
            {editingTeacher ? "تعديل بيانات المحفظ" : "إضافة محفظ جديد"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-mist-500 hover:text-parchment-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div>
          <label className="block text-sm text-mist-400 mb-2">
            اسم المحفظ <span className="text-rust-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="مثال: الشيخ أحمد عبد الرحمن"
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 text-sm"
          />
          {errors.name && <p className="text-rust-500 text-xs mt-1.5">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-mist-400 mb-2">رقم الهاتف</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="01xxxxxxxxx"
              className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 text-sm"
            />
            {errors.phone && <p className="text-rust-500 text-xs mt-1.5">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm text-mist-400 mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="teacher@example.com"
              className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 text-sm"
            />
            {errors.email && <p className="text-rust-500 text-xs mt-1.5">{errors.email}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm text-mist-400 mb-2">التخصص / الإجازة</label>
          <input
            value={form.specialization}
            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            placeholder="مثال: إجازة برواية حفص عن عاصم، أحكام التجويد، نور البيان"
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-mist-400 mb-2">ملاحظات إضافية</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="أي ملاحظات أو مواعيد خاصة..."
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="teacher_active"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="rounded border-navy-600 bg-navy-900 text-gold-500 focus:ring-0 h-4 w-4"
          />
          <label htmlFor="teacher_active" className="text-sm text-parchment-200 cursor-pointer">
            محفظ نشط (يظهر في قائمة التعيين للحلقات)
          </label>
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-navy-700">
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
