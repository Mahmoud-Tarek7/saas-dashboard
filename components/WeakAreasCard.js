"use client";

import React from "react";

const StarRating = ({ rating }) => {
  return (
    <div className="flex space-x-1 space-x-reverse" dir="rtl">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "text-rust-500" : "text-navy-600"
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

export default function WeakAreasCard({ weakAreas = [] }) {
  return (
    <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-5 h-5 text-rust-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h2 className="font-display font-bold text-lg text-parchment-100">نقاط تحتاج متابعة</h2>
      </div>

      {weakAreas.length === 0 ? (
        <div className="text-emerald-500 text-center py-6 text-sm font-bold">
          لا توجد نقاط ضعف حاليًا 🌟
        </div>
      ) : (
        <div className="flex flex-col">
          {weakAreas.map((area, index) => (
            <div
              key={index}
              className={`flex justify-between items-center py-3 ${
                index !== weakAreas.length - 1 ? "border-b border-navy-700" : ""
              }`}
            >
              <div>
                <p className="text-parchment-100 font-bold mb-1">
                  {area.surah_name} <span className="text-mist-500 text-xs font-normal">({area.surah_number})</span>
                </p>
                <StarRating rating={area.avgMastery} />
              </div>
              <div className="text-right">
                <span className="bg-rust-100 text-rust-500 text-xs px-2 py-1 rounded-full mb-1 inline-block">
                  تحتاج مراجعة
                </span>
                <p className="text-mist-400 text-xs text-center">{area.errors} أخطاء</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
