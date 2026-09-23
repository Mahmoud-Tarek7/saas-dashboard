"use client";

import React from "react";

export default function QuranProgressCard({ progress }) {
  if (!progress || progress.totalSessions === 0) {
    return (
      <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6 text-center">
        <h2 className="font-display font-bold text-lg text-parchment-100 mb-4 text-right">التقدم في الحفظ</h2>
        <p className="text-mist-400 py-8">لم يتم تسجيل حفظ بعد</p>
      </div>
    );
  }

  const {
    totalMemorized = 0,
    totalAyahs = 6236,
    percentage = 0,
    approxJuz = 0,
    latestSurah = "-",
    latestAyah = "-",
    recentMemorized = 0,
    totalSessions = 0,
    avgRating = 0,
    avgExamScore = 0,
  } = progress;

  return (
    <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display font-bold text-lg text-parchment-100">التقدم في الحفظ</h2>
        <div className="text-4xl font-bold text-gold-500 glow-text-gold">
          {percentage}%
        </div>
      </div>

      <div className="w-full h-3 rounded-full bg-navy-700 mb-8 overflow-hidden">
        <div 
          className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-700 glow-gold"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-mist-400">إجمالي المحفوظ</p>
          <p className="text-parchment-100 font-bold">{totalMemorized} آية</p>
        </div>
        <div>
          <p className="text-sm text-mist-400">تقريبًا</p>
          <p className="text-parchment-100 font-bold">{approxJuz} جزء</p>
        </div>
        <div>
          <p className="text-sm text-mist-400">آخر سورة</p>
          <p className="text-parchment-100 font-bold">{latestSurah}</p>
        </div>
        <div>
          <p className="text-sm text-mist-400">آخر موضع</p>
          <p className="text-parchment-100 font-bold">آيات {latestAyah}</p>
        </div>
        <div>
          <p className="text-sm text-mist-400">حفظ الشهر</p>
          <p className="text-parchment-100 font-bold">{recentMemorized} آية</p>
        </div>
        <div>
          <p className="text-sm text-mist-400">جلسات التسميع</p>
          <p className="text-parchment-100 font-bold">{totalSessions}</p>
        </div>
        <div>
          <p className="text-sm text-mist-400">متوسط التقييم</p>
          <p className="text-parchment-100 font-bold">{avgRating}/5</p>
        </div>
        <div>
          <p className="text-sm text-mist-400">متوسط الاختبارات</p>
          <p className="text-parchment-100 font-bold">{avgExamScore}%</p>
        </div>
      </div>
    </div>
  );
}
