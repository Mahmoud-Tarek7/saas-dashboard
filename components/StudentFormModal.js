"use client";

import { useEffect, useState } from "react";
import { createStudent, updateStudent } from "@/lib/students";
import { useToast } from "@/components/ToastProvider";

const emptyForm = { name: "", parent_phone: "", halaqa_id: "" };

/**
 * نموذج إضافة/تعديل طالب - مكوّن مشترك يُستخدم في:
 * - صفحة الطلاب (app/students/page.js)
 * - صفحة تفاصيل الحلقة (app/halaqat/[id]/page.js) لإضافة طالب مباشرة لحلقة معينة
 *
 * fixedHalaqaId: لو موجودة، بيتقفل اختيار الحلقة على القيمة دي (سياق "أضف طالب لهذه الحلقة")
 */
export default function StudentFormModal({
  open,
  onClose,
  onSaved,
  halaqat,
  editingStudent,
  fixedHalaqaId,
}) {
  const { addToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // ما نعرضش في اختيار الحلقة إلا الحلقات النشطة (ما ينفعش نضيف/ننقل طالب لحلقة متوقفة) -
  // إلا لو الطالب أصلًا مسجل في حلقة اتوقفت بعد كده، عشان الفورم ميبدلش حلقته من غير ما الإداري يقصد ده
  const selectableHalaqat = halaqat.filter(
    (h) => h.is_active || h.id === editingStudent?.halaqa_id
  );

  useEffect(() => {
    if (editingStudent) {
      setForm({
        name: editingStudent.name || "",
        parent_phone: editingStudent.parent_phone || "",
        halaqa_id: editingStudent.halaqa_id || "",
      });
    } else {
      const firstActive = halaqat.find((h) => h.is_active);
      setForm({
        ...emptyForm,
        halaqa_id: fixedHalaqaId || firstActive?.id || "",
      });
    }
    setErrors({});
  }, [editingStudent, open, halaqat, fixedHalaqaId]);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "اسم الطالب مطلوب";
    if (!form.halaqa_id) e.halaqa_id = "اختر الحلقة";
    if (form.parent_phone && !/^01[0-9]{9}$/.test(form.parent_phone.trim())) {
      e.parent_phone = "رقم الهاتف غير صحيح (مثال: 01xxxxxxxxx)";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    const { error } = editingStudent
      ? await updateStudent(editingStudent.id, {
          name: form.name.trim(),
          parent_phone: form.parent_phone.trim() || null,
          halaqa_id: form.halaqa_id,
        })
      : await createStudent({
          name: form.name.trim(),
          parent_phone: form.parent_phone.trim() || null,
          halaqa_id: form.halaqa_id,
        });

    setSaving(false);

    if (error) {
      addToast("حصل خطأ، حاول تاني", "error");
      return;
    }

    addToast(editingStudent ? "تم تعديل بيانات الطالب" : "تم إضافة الطالب بنجاح", "success");
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
          {editingStudent ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
        </h3>

        <div>
          <label className="block text-sm text-mist-400 mb-2">اسم الطالب</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
          />
          {errors.name && <p className="text-rust-500 text-xs mt-1.5">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm text-mist-400 mb-2">رقم ولي الأمر</label>
          <input
            value={form.parent_phone}
            onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
            dir="ltr"
            placeholder="01xxxxxxxxx"
          />
          {errors.parent_phone && (
            <p className="text-rust-500 text-xs mt-1.5">{errors.parent_phone}</p>
          )}
        </div>

        {!fixedHalaqaId && (
          <div>
            <label className="block text-sm text-mist-400 mb-2">الحلقة</label>
            <select
              value={form.halaqa_id}
              onChange={(e) => setForm({ ...form, halaqa_id: e.target.value })}
              className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
            >
              <option value="">اختر حلقة</option>
              {selectableHalaqat.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                  {!h.is_active ? " (متوقفة)" : ""}
                </option>
              ))}
            </select>
            {errors.halaqa_id && (
              <p className="text-rust-500 text-xs mt-1.5">{errors.halaqa_id}</p>
            )}
            {selectableHalaqat.length === 0 && (
              <p className="text-mist-500 text-xs mt-1.5">
                لا توجد حلقة نشطة حاليًا - أنشئ حلقة أولًا من صفحة الحلقات.
              </p>
            )}
          </div>
        )}

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
