"use client";

import React from "react";
import { SkeletonRow } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";

const StarRating = ({ rating }) => {
  return (
    <div className="flex space-x-1 space-x-reverse" dir="rtl">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3 h-3 md:w-4 md:h-4 ${
            star <= rating ? "text-gold-500" : "text-navy-600"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

const GradeBadge = ({ grade }) => {
  const grades = {
    'ممتاز': 'bg-emerald-100 text-emerald-500 border border-emerald-500/20',
    'جيد جدًا': 'bg-gold-500/10 text-gold-500 border border-gold-500/20',
    'جيد': 'bg-navy-700 text-mist-400 border border-navy-600',
    'مقبول': 'bg-rust-100 text-rust-500 border border-rust-500/20',
    'ضعيف': 'bg-rust-500/10 text-rust-500 border border-rust-500/50',
  };

  const className = grades[grade] || 'bg-navy-700 text-mist-400 border border-navy-600';

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${className}`}>
      {grade}
    </span>
  );
};

const SessionTypeBadge = ({ type }) => {
  const types = {
    new: { label: "حفظ جديد", className: "bg-emerald-100 text-emerald-500" },
    review: { label: "مراجعة", className: "bg-gold-500/10 text-gold-500" },
  };

  const entry = types[type] || {
    label: type || "-",
    className: "bg-navy-700 text-mist-400",
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${entry.className}`}>
      {entry.label}
    </span>
  );
};

export default function RecordHistoryTable({
  records = [],
  type = "memorization",
  loading = false,
  emptyMessage = "لا توجد سجلات",
  showStudentName = false,
}) {
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("ar-EG");
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="bg-navy-800 border border-navy-600 rounded-2xl p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6">
        <EmptyState title="لا توجد بيانات" description={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="bg-navy-800 border border-navy-600 rounded-2xl overflow-hidden">
      {/* Mobile view - Cards */}
      <div className="md:hidden flex flex-col">
        {records.map((record) => (
          <div key={record.id} className="border-b border-navy-700 p-4 hover:bg-navy-700/30 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm text-parchment-100 font-bold">
                {type === 'exam' ? record.exam_name : record.surah_name}
              </div>
              <div className="text-xs text-mist-400">{formatDate(record.date)}</div>
            </div>
            
            {showStudentName && (
              <div className="text-sm text-parchment-100 mb-2">
                الطالب: {record.students?.name}
              </div>
            )}

            <div className="flex justify-between items-center mt-3">
              {type === 'memorization' && (
                <>
                  <SessionTypeBadge type={record.session_type} />
                  <StarRating rating={record.rating} />
                </>
              )}
              {type === 'revision' && (
                <>
                  <span className="text-xs text-mist-400">الأخطاء: {record.errors_count}</span>
                  <StarRating rating={record.mastery_level} />
                </>
              )}
              {type === 'exam' && (
                <>
                  <span className="text-xs font-bold text-parchment-100">{record.total_score}%</span>
                  <GradeBadge grade={record.grade} />
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view - Table */}
      <div className="hidden md:block w-full overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-navy-900 text-mist-400 text-xs uppercase">
            <tr>
              <th className="py-3 px-4">التاريخ</th>
              {showStudentName && <th className="py-3 px-4">الطالب</th>}
              {type === 'memorization' && (
                <>
                  <th className="py-3 px-4">السورة</th>
                  <th className="py-3 px-4">من آية</th>
                  <th className="py-3 px-4">إلى آية</th>
                  <th className="py-3 px-4">النوع</th>
                  <th className="py-3 px-4">التقييم</th>
                  <th className="py-3 px-4">الأخطاء</th>
                  <th className="py-3 px-4">المحفظ</th>
                </>
              )}
              {type === 'revision' && (
                <>
                  <th className="py-3 px-4">السورة</th>
                  <th className="py-3 px-4">من آية</th>
                  <th className="py-3 px-4">إلى آية</th>
                  <th className="py-3 px-4">درجة الإتقان</th>
                  <th className="py-3 px-4">الأخطاء</th>
                  <th className="py-3 px-4">المحفظ</th>
                </>
              )}
              {type === 'exam' && (
                <>
                  <th className="py-3 px-4">الاختبار</th>
                  <th className="py-3 px-4">الدرجة</th>
                  <th className="py-3 px-4">التقدير</th>
                  <th className="py-3 px-4">الممتحن</th>
                </>
              )}
              <th className="py-3 px-4">الملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-b border-navy-700 hover:bg-navy-700/30 transition-colors">
                <td className="py-3 px-4 text-sm text-parchment-100">{formatDate(record.date)}</td>
                {showStudentName && <td className="py-3 px-4 text-sm text-parchment-100 font-bold">{record.students?.name}</td>}
                
                {type === 'memorization' && (
                  <>
                    <td className="py-3 px-4 text-sm text-parchment-100">{record.surah_name}</td>
                    <td className="py-3 px-4 text-sm text-parchment-100">{record.from_ayah}</td>
                    <td className="py-3 px-4 text-sm text-parchment-100">{record.to_ayah}</td>
                    <td className="py-3 px-4 text-sm"><SessionTypeBadge type={record.session_type} /></td>
                    <td className="py-3 px-4"><StarRating rating={record.rating} /></td>
                    <td className="py-3 px-4 text-sm text-parchment-100">{record.errors_count}</td>
                    <td className="py-3 px-4 text-sm text-mist-400">{record.teacher_name}</td>
                  </>
                )}

                {type === 'revision' && (
                  <>
                    <td className="py-3 px-4 text-sm text-parchment-100">{record.surah_name}</td>
                    <td className="py-3 px-4 text-sm text-parchment-100">{record.from_ayah}</td>
                    <td className="py-3 px-4 text-sm text-parchment-100">{record.to_ayah}</td>
                    <td className="py-3 px-4"><StarRating rating={record.mastery_level} /></td>
                    <td className="py-3 px-4 text-sm text-parchment-100">{record.errors_count}</td>
                    <td className="py-3 px-4 text-sm text-mist-400">{record.teacher_name}</td>
                  </>
                )}

                {type === 'exam' && (
                  <>
                    <td className="py-3 px-4 text-sm text-parchment-100">{record.exam_name}</td>
                    <td className="py-3 px-4 text-sm font-bold text-parchment-100">{record.total_score}%</td>
                    <td className="py-3 px-4"><GradeBadge grade={record.grade} /></td>
                    <td className="py-3 px-4 text-sm text-mist-400">{record.examiner_name}</td>
                  </>
                )}

                <td className="py-3 px-4 text-sm text-mist-500">
                  <div className="truncate max-w-[150px] cursor-help" title={record.notes}>
                    {record.notes || '-'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
