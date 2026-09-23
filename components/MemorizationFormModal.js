"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import { createMemorizationRecord } from "@/lib/memorization";
import { SURAHS, getSurahAyahCount } from "@/lib/quranData";
import { getTodayDate } from "@/lib/date";

export default function MemorizationFormModal({
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

  const defaultDate = getTodayDate();

  const [formData, setFormData] = useState({
    student_id: fixedStudentId || "",
    session_type: "new",
    surah_number: "",
    from_ayah: "",
    to_ayah: "",
    lines_count: "",
    rating: 0,
    tajweed_score: 0,
    errors_count: 0,
    error_types: [],
    date: defaultDate,
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Filter students if halaqa is fixed
  const filteredStudents = fixedHalaqaId
    ? students.filter((s) => s.halaqa_id === fixedHalaqaId)
    : students;

  // Handle surah change
  useEffect(() => {
    if (formData.surah_number) {
      const ayahCount = getSurahAyahCount(parseInt(formData.surah_number));
      setFormData((prev) => ({
        ...prev,
        from_ayah: 1,
        to_ayah: ayahCount,
      }));
    }
  }, [formData.surah_number]);

  // Reset form when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setFormData({
        student_id: fixedStudentId || "",
        session_type: "new",
        surah_number: "",
        from_ayah: "",
        to_ayah: "",
        lines_count: "",
        rating: 0,
        tajweed_score: 0,
        errors_count: 0,
        error_types: [],
        date: defaultDate,
        notes: "",
      });
      setErrors({});
    }
  }, [isModalOpen, fixedStudentId, defaultDate]);

  const validate = () => {
    const newErrors = {};

    if (!formData.student_id) newErrors.student_id = "اختر الطالب";
    if (!formData.surah_number) newErrors.surah_number = "اختر السورة";
    if (!formData.rating) newErrors.rating = "اختر التقييم";

    if (formData.surah_number) {
      const ayahCount = getSurahAyahCount(parseInt(formData.surah_number));
      const from = parseInt(formData.from_ayah);
      const to = parseInt(formData.to_ayah);

      if (
        isNaN(from) ||
        isNaN(to) ||
        from < 1 ||
        from > to ||
        to > ayahCount
      ) {
        newErrors.ayah_range = "رقم الآية غير صحيح";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const student = students.find((s) => s.id === formData.student_id);
      const halaqaId = fixedHalaqaId || student?.halaqa_id;
      const halaqa = halaqat.find((h) => h.id === halaqaId);
      const surahNumber = parseInt(formData.surah_number);
      const surah = SURAHS.find(
        (s) => s.number === surahNumber
      );

      const payload = {
        student_id: formData.student_id,
        halaqa_id: halaqaId,
        teacher_name: halaqa?.teacher_name || "",
        date: formData.date,
        session_type: formData.session_type,
        surah_number: surahNumber,
        surah_name: surah?.name || "",
        from_ayah: parseInt(formData.from_ayah),
        to_ayah: parseInt(formData.to_ayah),
        lines_count: formData.lines_count
          ? parseInt(formData.lines_count)
          : null,
        rating: formData.rating,
        tajweed_score: formData.tajweed_score || null,
        errors_count: parseInt(formData.errors_count) || 0,
        error_types: formData.error_types,
        notes: formData.notes,
      };

      await createMemorizationRecord(payload);
      addToast("تم تسجيل التسميع بنجاح", "success");
      handleSaved();
      onClose();
    } catch (error) {
      console.error(error);
      addToast("حدث خطأ أثناء الحفظ", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleErrorTypeToggle = (type) => {
    setFormData((prev) => {
      const current = prev.error_types || [];
      const updated = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      return { ...prev, error_types: updated };
    });
  };

  const renderStars = (currentRating, onChange, colorClass, emptyClass) => {
    const labels = ["ضعيف", "مقبول", "جيد", "جيد جدًا", "ممتاز"];
    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-1" dir="ltr">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="focus:outline-none"
            >
              <svg
                className={`w-8 h-8 ${
                  star <= currentRating ? colorClass : emptyClass
                } transition-colors duration-200`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          ))}
        </div>
        {currentRating > 0 && (
          <span className={`text-xs ${colorClass}`}>
            {labels[currentRating - 1]}
          </span>
        )}
      </div>
    );
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy-950/70 backdrop-blur-sm px-4">
      <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="font-display font-bold text-lg text-parchment-100 mb-4">
          تسجيل تسميع
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-mist-400 mb-2">الطالب</label>
              <select
                value={formData.student_id}
                onChange={(e) =>
                  setFormData({ ...formData, student_id: e.target.value })
                }
                className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
                disabled={!!fixedStudentId}
              >
                <option value="">اختر الطالب...</option>
                {filteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.student_id && (
                <p className="text-rust-500 text-xs mt-1.5">
                  {errors.student_id}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-mist-400 mb-2">
                التاريخ
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
              />
            </div>
          </div>

          {/* Session Type */}
          <div>
            <label className="block text-sm text-mist-400 mb-2">
              نوع التسميع
            </label>
            <div className="flex gap-4">
              {[
                { value: "new", label: "حفظ جديد" },
                { value: "review", label: "مراجعة" },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="session_type"
                    value={value}
                    checked={formData.session_type === value}
                    onChange={(e) =>
                      setFormData({ ...formData, session_type: e.target.value })
                    }
                    className="accent-gold-500 w-4 h-4"
                  />
                  <span className="text-sm text-parchment-100">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Surah & Ayahs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm text-mist-400 mb-2">السورة</label>
              <select
                value={formData.surah_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    surah_number: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
              >
                <option value="">اختر السورة...</option>
                {SURAHS?.map((s) => (
                  <option key={s.number} value={s.number}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.surah_number && (
                <p className="text-rust-500 text-xs mt-1.5">
                  {errors.surah_number}
                </p>
              )}
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-mist-400 mb-2">
                  من آية
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.from_ayah}
                  onChange={(e) =>
                    setFormData({ ...formData, from_ayah: e.target.value })
                  }
                  className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
                  disabled={!formData.surah_number}
                />
              </div>
              <div>
                <label className="block text-sm text-mist-400 mb-2">
                  إلى آية
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.to_ayah}
                  onChange={(e) =>
                    setFormData({ ...formData, to_ayah: e.target.value })
                  }
                  className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
                  disabled={!formData.surah_number}
                />
              </div>
            </div>
            {errors.ayah_range && (
              <p className="text-rust-500 text-xs mt-1.5 md:col-span-3">
                {errors.ayah_range}
              </p>
            )}
          </div>

          {/* Lines & Errors count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-mist-400 mb-2">
                عدد الأسطر (اختياري)
              </label>
              <input
                type="number"
                min="1"
                value={formData.lines_count}
                onChange={(e) =>
                  setFormData({ ...formData, lines_count: e.target.value })
                }
                className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm text-mist-400 mb-2">
                عدد الأخطاء
              </label>
              <input
                type="number"
                min="0"
                value={formData.errors_count}
                onChange={(e) =>
                  setFormData({ ...formData, errors_count: e.target.value })
                }
                className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
              />
            </div>
          </div>

          {/* Error types */}
          <div>
            <label className="block text-sm text-mist-400 mb-2">
              نوع الأخطاء
            </label>
            <div className="flex gap-4">
              {["تجويد", "حفظ", "ترتيب"].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.error_types?.includes(type)}
                    onChange={() => handleErrorTypeToggle(type)}
                    className="accent-gold-500 w-4 h-4 rounded border-navy-600"
                  />
                  <span className="text-sm text-parchment-100">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-mist-400 mb-2">
                التقييم العام
              </label>
              {renderStars(
                formData.rating,
                (val) => setFormData({ ...formData, rating: val }),
                "text-gold-500",
                "text-navy-600"
              )}
              {errors.rating && (
                <p className="text-rust-500 text-xs mt-1.5">{errors.rating}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-mist-400 mb-2">
                تقييم التجويد (اختياري)
              </label>
              {renderStars(
                formData.tajweed_score,
                (val) => setFormData({ ...formData, tajweed_score: val }),
                "text-emerald-500",
                "text-navy-600"
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-mist-400 mb-2">
              ملاحظات المعلم
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-navy-700">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg text-sm text-mist-400 hover:text-parchment-100 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-6 py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 transition-colors"
            >
              {saving ? "جاري الحفظ..." : "حفظ التسميع"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
