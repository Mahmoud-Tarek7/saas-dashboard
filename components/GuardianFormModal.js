"use client";

import { useEffect, useState } from "react";
import { createGuardian, updateGuardian, findGuardianByPhone } from "@/lib/guardians";
import { useToast } from "@/components/ToastProvider";

const emptyForm = {
  name: "",
  phone: "",
  secondary_phone: "",
  email: "",
  address: "",
  notes: "",
  is_active: true,
};

export default function GuardianFormModal({ open, onClose, onSaved, editingGuardian }) {
  const { addToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingGuardian) {
      setForm({
        name: editingGuardian.name || "",
        phone: editingGuardian.phone || "",
        secondary_phone: editingGuardian.secondary_phone || "",
        email: editingGuardian.email || "",
        address: editingGuardian.address || "",
        notes: editingGuardian.notes || "",
        is_active: editingGuardian.is_active !== false,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [editingGuardian, open]);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "اسم ولي الأمر مطلوب";
    if (form.phone && !/^01[0-9]{9}$/.test(form.phone.trim())) {
      e.phone = "رقم الهاتف غير صحيح (مثال: 01xxxxxxxxx)";
    }
    if (form.secondary_phone && !/^01[0-9]{9}$/.test(form.secondary_phone.trim())) {
      e.secondary_phone = "رقم الهاتف الإضافي غير صحيح";
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = "البريد الإلكتروني غير صحيح";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    const phone = form.phone.trim() || null;
    if (phone) {
      const { data: existing } = await findGuardianByPhone(phone);
      if (existing && existing.id !== editingGuardian?.id) {
        setSaving(false);
        setErrors({ phone: `يوجد ولي أمر مسجل بنفس الرقم: ${existing.name}` });
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      phone,
      secondary_phone: form.secondary_phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
      is_active: form.is_active,
    };

    const { error } = editingGuardian
      ? await updateGuardian(editingGuardian.id, payload)
      : await createGuardian(payload);

    setSaving(false);

    if (error) {
      if (error.code === "23505") {
        addToast("رقم الهاتف مسجل مسبقاً لولي أمر آخر", "error");
      } else {
        addToast("حصل خطأ، حاول تاني", "error");
      }
      return;
    }

    addToast(editingGuardian ? "تم تعديل بيانات ولي الأمر" : "تم إضافة ولي الأمر بنجاح", "success");
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
          {editingGuardian ? "تعديل بيانات ولي الأمر" : "إضافة ولي أمر"}
        </h3>

        <div>
          <label className="block text-sm text-mist-400 mb-2">الاسم</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
          />
          {errors.name && <p className="text-rust-500 text-xs mt-1.5">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-mist-400 mb-2">رقم الهاتف</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
              dir="ltr"
            />
            {errors.phone && <p className="text-rust-500 text-xs mt-1.5">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm text-mist-400 mb-2">رقم هاتف إضافي</label>
            <input
              value={form.secondary_phone}
              onChange={(e) => setForm({ ...form, secondary_phone: e.target.value })}
              className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
              dir="ltr"
            />
            {errors.secondary_phone && (
              <p className="text-rust-500 text-xs mt-1.5">{errors.secondary_phone}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm text-mist-400 mb-2">البريد الإلكتروني</label>
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
            dir="ltr"
          />
          {errors.email && <p className="text-rust-500 text-xs mt-1.5">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm text-mist-400 mb-2">العنوان</label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
          />
        </div>

        <div>
          <label className="block text-sm text-mist-400 mb-2">ملاحظات</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 resize-none"
          />
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
