"use client";

import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-navy-900 border border-navy-600 rounded-lg p-3 shadow-lg">
        <p className="text-mist-400 text-xs mb-1">{data.date}</p>
        <p className="text-parchment-100 font-bold text-sm">التقييم: {data.rating}/5</p>
      </div>
    );
  }
  return null;
};

export default function PerformanceChart({ data = [] }) {
  if (!data || data.length < 2) {
    return (
      <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6">
        <h2 className="font-display font-bold text-lg text-parchment-100 mb-4 text-right">تطور الأداء</h2>
        <div className="h-[250px] flex items-center justify-center">
          <p className="text-mist-400">لا توجد بيانات كافية لعرض الرسم البياني</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6">
      <h2 className="font-display font-bold text-lg text-parchment-100 mb-6 text-right">تطور الأداء</h2>
      <div className="h-[250px] w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="session" 
              tick={{ fill: '#64748B', fontSize: 12 }} 
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              domain={[1, 5]} 
              ticks={[1, 2, 3, 4, 5]} 
              tick={{ fill: '#64748B', fontSize: 12 }} 
              axisLine={false} 
              tickLine={false} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="rating" 
              stroke="#D4AF37" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#goldGradient)" 
              activeDot={{ r: 6, fill: "#D4AF37", stroke: "#0B1120", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
