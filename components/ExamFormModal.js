"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import { SURAHS } from "@/lib/quranData";
import { createExam } from "@/lib/exams";
import { getTodayDate } from "@/lib/date";

export default function ExamFormModal({
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
    exam_name: "",
    student_id: "",
    examiner_name: "",
    date: getTodayDate(),
    surah_from: "",
    surah_to: "",
    hifz_score: 100,
    tajweed_score: 100,
    performance_score: 100,
    errors_count: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      setFormData((prev) => ({
        ...prev,
        student_id: fixedStudentId || "",
        exam_name: "",
        examiner_name: "",
        date: getTodayDate(),
        surah_from: "",
        surah_to: "",
        hifz_score: 100,
        tajweed_score: 100,
        performance_score: 100,
        errors_count: "",
        notes: "",
      }));
      setErrors({});
    }
  }, [isModalOpen, fixedStudentId]);

  const calculateTotal = () => {
    return Math.round(
      formData.hifz_score * 0.5 +
        formData.tajweed_score * 0.3 +
        formData.performance_score * 0.2
    );
  };

  const getGrade = (total) => {
    if (total >= 90) return { label: "ممتاز", color: "text-emerald-500" };
    if (total >= 80) return { label: "جيد جدًا", color: "text-gold-500" };
    if (total >= 70) return { label: "جيد", color: "text-mist-400" };
    if (total >= 60) return { label: "مقبول", color: "text-rust-500" }; // rust-500 as orange equivalent
    return { label: "ضعيف", color: "text-rust-500" }; // rust-500 as red equivalent
  };

  const totalScore = calculateTotal();
  const gradeInfo = getGrade(totalScore);

  const validate = () => {
    const newErrors = {};
    if (!formData.exam_name.trim()) newErrors.exam_name = "اسم الاختبار مطلوب";
    if (!formData.student_id) newErrors.student_id = "يرجى اختيار الطالب";
    if (!formData.surah_from) newErrors.surah_from = "مطلوب";
    if (!formData.surah_to) newErrors.surah_to = "مطلوب";
    
    if (formData.surah_from && formData.surah_to) {
      const from = parseInt(formData.surah_from, 10);
      const to = parseInt(formData.surah_to, 10);
      if (from > to) {
        newErrors.surah_from = "يجب أن تكون السورة قبل أو نفس سورة النهاية";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      let currentHalaqaId = fixedHalaqaId;
      if (!currentHalaqaId) {
        const student = students.find((s) => s.id === formData.student_id);
        currentHalaqaId = student?.halaqa_id;
      }

      const recordData = {
        student_id: formData.student_id,
        halaqa_id: currentHalaqaId,
        exam_name: formData.exam_name,
        examiner_name: formData.examiner_name,
        date: formData.date,
        surah_from: parseInt(formData.surah_from, 10),
        surah_to: parseInt(formData.surah_to, 10),
        hifz_score: parseInt(formData.hifz_score, 10),
        tajweed_score: parseInt(formData.tajweed_score, 10),
        performance_score: parseInt(formData.performance_score, 10),
        total_score: totalScore,
        grade: gradeInfo.label,
        errors_count: formData.errors_count ? parseInt(formData.errors_count, 10) : 0,
        notes: formData.notes,
      };

      await createExam(recordData);
      addToast("تم تسجيل الاختبار بنجاح", "success");
      
      handleSaved();
      onClose();
    } catch (error) {
      console.error("Error saving exam:", error);
      addToast("حدث خطأ أثناء حفظ الاختبار", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy-950/70 backdrop-blur-sm px-4" dir="rtl">
      <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="font-display font-bold text-lg text-parchment-100">
          تسجيل اختبار جديد
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-mist-400 mb-2">اسم الاختبار</label>
            <input
              type="text"
              value={formData.exam_name}
              onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
              className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
              placeholder="مثال: اختبار نهاية الجزء العشرين"
            />
            {errors.exam_name && <p className="text-rust-500 text-xs mt-1.5">{errors.exam_name}</p>}
          </div>

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
            <label className="block text-sm text-mist-400 mb-2">اسم المختبر (اختياري)</label>
            <input
              type="text"
              value={formData.examiner_name}
              onChange={(e) => setFormData({ ...formData, examiner_name: e.target.value })}
              className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-mist-400 mb-2">من سورة</label>
              <select
                value={formData.surah_from}
                onChange={(e) => setFormData({ ...formData, surah_from: e.target.value })}
                className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
              >
                <option value="">اختر السورة</option>
                {SURAHS.map((s) => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {s.name}
                  </option>
                ))}
              </select>
              {errors.surah_from && <p className="text-rust-500 text-xs mt-1.5">{errors.surah_from}</p>}
            </div>
            <div>
              <label className="block text-sm text-mist-400 mb-2">إلى سورة</label>
              <select
                value={formData.surah_to}
                onChange={(e) => setFormData({ ...formData, surah_to: e.target.value })}
                className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
              >
                <option value="">اختر السورة</option>
                {SURAHS.map((s) => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {s.name}
                  </option>
                ))}
              </select>
              {errors.surah_to && <p className="text-rust-500 text-xs mt-1.5">{errors.surah_to}</p>}
            </div>
          </div>

          <div className="space-y-4 py-4 border-y border-navy-700">
            <div>
              <label className="block text-sm text-mist-400 mb-2">
                درجة الحفظ (50%): <span className="text-parchment-100 font-bold">{formData.hifz_score}</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.hifz_score}
                onChange={(e) => setFormData({ ...formData, hifz_score: e.target.value })}
                className="w-full accent-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm text-mist-400 mb-2">
                درجة التجويد (30%): <span className="text-parchment-100 font-bold">{formData.tajweed_score}</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.tajweed_score}
                onChange={(e) => setFormData({ ...formData, tajweed_score: e.target.value })}
                className="w-full accent-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm text-mist-400 mb-2">
                درجة الأداء (20%): <span className="text-parchment-100 font-bold">{formData.performance_score}</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.performance_score}
                onChange={(e) => setFormData({ ...formData, performance_score: e.target.value })}
                className="w-full accent-gold-500"
              />
            </div>
          </div>

          <div className="bg-navy-900 rounded-xl p-4 flex justify-between items-center border border-navy-600">
            <div>
              <span className="text-sm text-mist-400 block mb-1">الدرجة النهائية</span>
              <span className="font-display font-bold text-2xl text-parchment-100">{totalScore}%</span>
            </div>
            <div className="text-left">
              <span className="text-sm text-mist-400 block mb-1">التقدير</span>
              <span className={`font-display font-bold text-2xl ${gradeInfo.color}`}>
                {gradeInfo.label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-2">
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
            <div>
              <label className="block text-sm text-mist-400 mb-2">ملاحظات (اختياري)</label>
              <textarea
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 resize-none"
              ></textarea>
            </div>
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
              {isSaving ? "جاري الحفظ..." : "حفظ الاختبار"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
