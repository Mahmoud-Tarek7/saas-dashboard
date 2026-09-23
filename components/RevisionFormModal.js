"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import { SURAHS, getSurahAyahCount } from "@/lib/quranData";
import { createRevisionRecord } from "@/lib/revision";
import { getTodayDate } from "@/lib/date";

export default function RevisionFormModal({
  open,
  isOpen,
  onClose,
  onSaved,
  onSave,
  students = [],
  halaqat = [],
  fixedStudentId,
  fixedHalaqaId,
}) {
  const isModalOpen = open ?? isOpen;
  const handleSaved = onSaved ?? onSave ?? (() => {});
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    student_id: "",
    surah_number: "",
    surah_name: "",
    from_ayah: "",
    to_ayah: "",
    pages_count: "",
    mastery_level: 3, // Default to 'جيد'
    errors_count: "",
    date: getTodayDate(),
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize fixed values
  useEffect(() => {
    if (isModalOpen) {
      setFormData((prev) => ({
        ...prev,
        student_id: fixedStudentId || "",
        date: getTodayDate(),
        surah_number: "",
        surah_name: "",
        from_ayah: "",
        to_ayah: "",
        pages_count: "",
        mastery_level: 3,
        errors_count: "",
        notes: "",
      }));
      setErrors({});
    }
  }, [isModalOpen, fixedStudentId]);

  const handleSurahChange = (e) => {
    const num = parseInt(e.target.value, 10);
    const surah = SURAHS.find((s) => s.number === num);
    setFormData((prev) => ({
      ...prev,
      surah_number: num,
      surah_name: surah ? surah.name : "",
      from_ayah: "",
      to_ayah: "",
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.student_id) newErrors.student_id = "يرجى اختيار الطالب";
    if (!formData.surah_number) newErrors.surah_number = "يرجى اختيار السورة";
    if (!formData.from_ayah) newErrors.from_ayah = "مطلوب";
    if (!formData.to_ayah) newErrors.to_ayah = "مطلوب";

    if (formData.surah_number) {
      const maxAyahs = getSurahAyahCount(formData.surah_number);
      const from = parseInt(formData.from_ayah, 10);
      const to = parseInt(formData.to_ayah, 10);

      if (from > maxAyahs || from < 1) {
        newErrors.from_ayah = `يجب أن يكون بين 1 و ${maxAyahs}`;
      }
      if (to > maxAyahs || to < 1) {
        newErrors.to_ayah = `يجب أن يكون بين 1 و ${maxAyahs}`;
      }
      if (from && to && from > to) {
        newErrors.from_ayah = "يجب أن يكون أقل من أو يساوي إلى آية";
      }
    }

    if (!formData.mastery_level) newErrors.mastery_level = "يرجى تحديد مستوى الإتقان";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      // Find halaqa_id if fixedStudentId isn't provided or we need it from the student object
      let currentHalaqaId = fixedHalaqaId;
      if (!currentHalaqaId) {
        const student = students.find((s) => s.id === formData.student_id);
        currentHalaqaId = student?.halaqa_id;
      }

      const recordData = {
        student_id: formData.student_id,
        halaqa_id: currentHalaqaId,
        date: formData.date,
        surah_number: formData.surah_number,
        surah_name: formData.surah_name,
        from_ayah: parseInt(formData.from_ayah, 10),
        to_ayah: parseInt(formData.to_ayah, 10),
        pages_count: formData.pages_count ? parseFloat(formData.pages_count) : null,
        mastery_level: formData.mastery_level,
        errors_count: formData.errors_count ? parseInt(formData.errors_count, 10) : 0,
        notes: formData.notes,
      };

      await createRevisionRecord(recordData);
      addToast("تم تسجيل المراجعة بنجاح", "success");
      
      handleSaved();
      onClose();
    } catch (error) {
      console.error("Error saving revision:", error);
      addToast("حدث خطأ أثناء حفظ التسجيل", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const masteryLabels = {
    1: "ضعيف",
    2: "مقبول",
    3: "جيد",
    4: "جيد جدًا",
    5: "ممتاز",
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy-950/70 backdrop-blur-sm px-4" dir="rtl">
      <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="font-display font-bold text-lg text-parchment-100">
          تسجيل جلسة مراجعة
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-mist-400 mb-2">الطالب</label>
              <select
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
                disabled={!!fixedStudentId}
              >
                <option value="">اختر الطالب</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.student_id && <p className="text-rust-500 text-xs mt-1.5">{errors.student_id}</p>}
            </div>
            
            <div>
              <label className="block text-sm text-mist-400 mb-2">التاريخ</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-mist-400 mb-2">السورة</label>
            <select
              value={formData.surah_number}
              onChange={handleSurahChange}
              className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
            >
              <option value="">اختر السورة</option>
              {SURAHS.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.name}
                </option>
              ))}
            </select>
            {errors.surah_number && <p className="text-rust-500 text-xs mt-1.5">{errors.surah_number}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-mist-400 mb-2">من آية</label>
              <input
                type="number"
                min="1"
                value={formData.from_ayah}
                onChange={(e) => setFormData({ ...formData, from_ayah: e.target.value })}
                className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
              />
              {errors.from_ayah && <p className="text-rust-500 text-xs mt-1.5">{errors.from_ayah}</p>}
            </div>
            <div>
              <label className="block text-sm text-mist-400 mb-2">إلى آية</label>
              <input
                type="number"
                min="1"
                value={formData.to_ayah}
                onChange={(e) => setFormData({ ...formData, to_ayah: e.target.value })}
                className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
              />
              {errors.to_ayah && <p className="text-rust-500 text-xs mt-1.5">{errors.to_ayah}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-mist-400 mb-2">عدد الصفحات (اختياري)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.pages_count}
                onChange={(e) => setFormData({ ...formData, pages_count: e.target.value })}
                className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm text-mist-400 mb-2">عدد الأخطاء (اختياري)</label>
              <input
                type="number"
                min="0"
                value={formData.errors_count}
                onChange={(e) => setFormData({ ...formData, errors_count: e.target.value })}
                className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-mist-400 mb-2">
              مستوى الإتقان: <span className="text-gold-500 font-bold">{masteryLabels[formData.mastery_level]}</span>
            </label>
            <div className="flex items-center gap-2" dir="ltr">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, mastery_level: star })}
                  className="focus:outline-none"
                >
                  <svg
                    className={`w-8 h-8 ${star <= formData.mastery_level ? 'text-gold-500 fill-current' : 'text-navy-600 fill-current'}`}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
            {errors.mastery_level && <p className="text-rust-500 text-xs mt-1.5">{errors.mastery_level}</p>}
          </div>

          <div>
            <label className="block text-sm text-mist-400 mb-2">ملاحظات (اختياري)</label>
            <textarea
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 resize-none"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-navy-700">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm text-mist-400 hover:text-parchment-100"
              disabled={isSaving}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-6 py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 flex items-center justify-center min-w-[100px]"
            >
              {isSaving ? "جاري الحفظ..." : "حفظ المراجعة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
