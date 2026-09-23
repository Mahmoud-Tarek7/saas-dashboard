"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AuthGuard from "@/components/AuthGuard";
import { getMonthKey } from "@/lib/date";
import { getSettings } from "@/lib/settings";

function SubscriptionsContent() {
  const [students, setStudents] = useState([]);
  const [paidMap, setPaidMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterUnpaid, setFilterUnpaid] = useState(false);
  const [payForm, setPayForm] = useState(null);
  const [defaultAmount, setDefaultAmount] = useState("100");
  const [currency, setCurrency] = useState("EGP");
  const [amount, setAmount] = useState("100");
  const [method, setMethod] = useState("cash");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const month = getMonthKey();

  async function load() {
    const [{ data: studentsData }, { data: subsData }, { data: settingsData }] =
      await Promise.all([
        supabase.from("students").select("*").eq("is_active", true).order("name"),
        supabase.from("subscriptions").select("student_id, amount").eq("month", month),
        getSettings(),
      ]);

    const map = {};
    (subsData || []).forEach((s) => {
      map[s.student_id] = s.amount;
    });

    const configuredAmount =
      settingsData?.default_subscription_amount != null
        ? String(settingsData.default_subscription_amount)
        : "100";

    setDefaultAmount(configuredAmount);
    setAmount(configuredAmount);
    if (settingsData?.currency) {
      setCurrency(settingsData.currency);
    }

    setStudents(studentsData || []);
    setPaidMap(map);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePay(studentId) {
    setSaving(true);
    setError(null);
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from("subscriptions").insert({
      student_id: studentId,
      month,
      amount: Number(amount),
      payment_method: method,
      recorded_by: user?.id,
    });

    setSaving(false);
    
    if (insertError) {
      // Check if it's a duplicate key error
      if (insertError.code === '23505') {
        setError(`تم تسجيل اشتراك لهذا الطالب في شهر ${month} مسبقاً. لا يمكن تسجيل اشتراك مكرر.`);
      } else {
        setError(`حدث خطأ في حفظ الاشتراك: ${insertError.message}`);
      }
      console.error('Subscription error:', insertError);
    } else {
      setPayForm(null);
      setError(null);
      load();
    }
  }

  const visibleStudents = filterUnpaid
    ? students.filter((s) => !paidMap[s.id])
    : students;

  const paidCount = students.filter((s) => paidMap[s.id]).length;

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display font-bold text-3xl text-parchment-100 glow-text-gold">
          الاشتراكات
        </h1>
        <p className="text-mist-400 text-sm mt-1.5">
          شهر {month} · {paidCount} من {students.length} دفعوا
        </p>
      </div>

      {error && (
        <div className="mb-5 border border-rust-500/30 bg-rust-100 text-rust-500 rounded-xl px-5 py-4 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setFilterUnpaid(false)}
          className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
            !filterUnpaid
              ? "bg-gold-500 text-navy-950 border-gold-500 font-bold"
              : "bg-navy-800 border-navy-600 text-mist-400"
          }`}
        >
          الكل
        </button>
        <button
          onClick={() => setFilterUnpaid(true)}
          className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
            filterUnpaid
              ? "bg-rust-500 text-navy-950 border-rust-500 font-bold"
              : "bg-navy-800 border-navy-600 text-mist-400"
          }`}
        >
          المتأخرين فقط
        </button>
      </div>

      {loading ? (
        <p className="text-mist-400">جاري التحميل...</p>
      ) : (
        <div className="divide-y divide-navy-700 border border-navy-600 rounded-2xl bg-navy-800/50 overflow-hidden">
          {visibleStudents.map((s) => (
            <div key={s.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-parchment-100">{s.name}</span>
                {paidMap[s.id] ? (
                  <span className="text-sm px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-500 border border-emerald-500/20">
                    دافع · {paidMap[s.id]} {currency === "EGP" ? "جنيه" : currency}
                  </span>
                ) : payForm === s.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-20 rounded-lg border border-navy-600 bg-navy-900 text-parchment-100 px-2 py-1 text-sm outline-none focus:border-gold-500"
                    />
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="rounded-lg border border-navy-600 bg-navy-900 text-parchment-100 px-2 py-1 text-sm outline-none"
                    >
                      <option value="cash">كاش</option>
                      <option value="vodafone_cash">فودافون كاش</option>
                    </select>
                    <button
                      onClick={() => handlePay(s.id)}
                      disabled={saving}
                      className="bg-gold-500 text-navy-950 px-3 py-1 rounded-lg text-sm font-bold disabled:opacity-60"
                    >
                      تأكيد
                    </button>
                  </div>
                 ) : (
                  <button
                    onClick={() => {
                      setPayForm(s.id);
                      setAmount(defaultAmount);
                      setError(null);
                    }}
                    className="text-sm px-3.5 py-1 rounded-full bg-rust-100 text-rust-500 border border-rust-500/20"
                  >
                    متأخر · تسجيل دفعة
                  </button>
                 )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <AuthGuard>
      <SubscriptionsContent />
    </AuthGuard>
  );
}
