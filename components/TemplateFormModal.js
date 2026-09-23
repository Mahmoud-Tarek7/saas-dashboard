"use client";

import { useEffect, useState } from "react";
import { createTemplate, updateTemplate } from "@/lib/communications";
import { useToast } from "@/components/ToastProvider";

const emptyForm = {
  name: "",
  title: "",
  body: "",
  category: "general",
  is_active: true,
};

const CATEGORIES = [
  { id: "general", label: "عام" },
  { id: "attendance", label: "حضور" },
  { id: "memorization", label: "حفظ" },
  { id: "exams", label: "اختبارات" },
  { id: "subscriptions", label: "اشتراكات" },
  { id: "meetings", label: "اجتماعات" },
];

export default function TemplateFormModal({ open, onClose, onSaved, editingTemplate }) {
  const { addToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingTemplate) {
      setForm({
        name: editingTemplate.name || "",
        title: editingTemplate.title || "",
        body: editingTemplate.body || "",
        category: editingTemplate.category || "general",
        is_active: editingTemplate.is_active !== false,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [editingTemplate, open]);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "اسم القالب مطلوب";
    if (!form.title.trim()) e.title = "عنوان الرسالة مطلوب";
    if (!form.body.trim()) e.body = "نص القالب مطلوب";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      title: form.title.trim(),
      body: form.body.trim(),
      category: form.category,
      is_active: form.is_active,
    };

    const { error } = editingTemplate
      ? await updateTemplate(editingTemplate.id, payload)
      : await createTemplate(payload);

    setSaving(false);

    if (error) {
      addToast("حصل خطأ، حاول تاني", "error");
      return;
    }

    addToast(editingTemplate ? "تم تعديل القالب" : "تم إنشاء القالب", "success");
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
        <h3 className="font-display font-bold text-lg text-parchment-100">
          {editingTemplate ? "تعديل القالب" : "قالب جديد"}
        </h3>

        <div>
          <label className="block text-sm text-mist-400 mb-2">اسم القالب</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
          />
          {errors.name && <p className="text-rust-500 text-xs mt-1.5">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm text-mist-400 mb-2">التصنيف</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-mist-400 mb-2">عنوان الرسالة</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
          />
          {errors.title && <p className="text-rust-500 text-xs mt-1.5">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm text-mist-400 mb-2">النص</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={5}
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 resize-none"
          />
          {errors.body && <p className="text-rust-500 text-xs mt-1.5">{errors.body}</p>}
        </div>

        <div>
          <label className="block text-sm text-mist-400 mb-2">الحالة</label>
          <select
            value={form.is_active ? "active" : "inactive"}
            onChange={(e) => setForm({ ...form, is_active: e.target.value === "active" })}
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
          >
            <option value="active">نشط</option>
            <option value="inactive">متوقف</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-6 py-2.5 rounded-lg text-sm font-bold disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : "حفظ"}
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
