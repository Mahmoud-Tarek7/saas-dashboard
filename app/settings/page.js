"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { useToast } from "@/components/ToastProvider";
import { getSettings, updateSettings } from "@/lib/settings";

function SettingsContent() {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [settingsId, setSettingsId] = useState(null);
  const [formData, setFormData] = useState({
    center_name: "",
    manager_name: "",
    phone: "",
    email: "",
    address: "",
    default_subscription_amount: "100",
    currency: "EGP",
    updated_at: null,
  });

  async function loadSettings() {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getSettings();

    if (fetchError) {
      console.error("Failed to load settings:", fetchError);
      setError("فشل في تحميل إعدادات المركز. يرجى إعادة المحاولة.");
    } else if (data) {
      setSettingsId(data.id);
      setFormData({
        center_name: data.center_name || "",
        manager_name: data.manager_name || "",
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        default_subscription_amount:
          data.default_subscription_amount != null
            ? String(data.default_subscription_amount)
            : "100",
        currency: data.currency || "EGP",
        updated_at: data.updated_at,
      });
    }

    setLoading(false);
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Form validations
    if (!formData.center_name.trim()) {
      setError("اسم المركز حقل مطلوب ولا يمكن تركه فارغاً.");
      return;
    }

    const amountNum = Number(formData.default_subscription_amount);
    if (
      formData.default_subscription_amount === "" ||
      isNaN(amountNum) ||
      amountNum < 0
    ) {
      setError("قيمة الاشتراك الافتراضية يجب أن تكون رقماً صالحاً وغير سالب (0 أو أكثر).");
      return;
    }

    setSaving(true);

    const { data, error: saveError } = await updateSettings({
      id: settingsId,
      center_name: formData.center_name,
      manager_name: formData.manager_name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      default_subscription_amount: amountNum,
      currency: formData.currency,
    });

    setSaving(false);

    if (saveError) {
      console.error("Failed to update settings:", saveError);
      setError(saveError.message || "حدث خطأ أثناء حفظ الإعدادات.");
      addToast("فشل في حفظ التعديلات", "error");
    } else {
      setSuccess("تم حفظ إعدادات المركز بنجاح.");
      addToast("تم حفظ الإعدادات بنجاح", "success");
      if (data) {
        setFormData((prev) => ({
          ...prev,
          updated_at: data.updated_at,
        }));
      }
    }
  }

  const formattedUpdatedAt = formData.updated_at
    ? new Date(formData.updated_at).toLocaleString("ar-EG", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "غير محدد";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-parchment-100 glow-text-gold">
          الإعدادات
        </h1>
        <p className="text-mist-400 text-sm mt-1.5">
          إدارة بيانات المركز، وإعدادات الاشتراكات الافتراضية، والنظام
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="border border-rust-500/30 bg-rust-100 text-rust-500 rounded-xl px-5 py-4 text-sm flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="border border-emerald-500/30 bg-emerald-100 text-emerald-500 rounded-xl px-5 py-4 text-sm flex items-center gap-3">
          <span className="text-lg">✓</span>
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-8 text-center text-mist-400">
          جاري تحميل الإعدادات...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1 — CENTER INFORMATION */}
          <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-6">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-navy-700">
              <div className="h-9 w-9 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center font-bold">
                🏛️
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-parchment-100">
                  بيانات المركز
                </h2>
                <p className="text-mist-400 text-xs mt-0.5">
                  المعلومات الأساسية لمركز تحفيظ القرآن الكريم
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Center Name */}
              <div className="sm:col-span-2">
                <label className="block text-mist-400 text-xs font-medium mb-2">
                  اسم المركز <span className="text-rust-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.center_name}
                  onChange={(e) => handleChange("center_name", e.target.value)}
                  placeholder="مثال: مركز الإيمان لتحفيظ القرآن الكريم"
                  className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 text-sm"
                />
              </div>

              {/* Manager Name */}
              <div>
                <label className="block text-mist-400 text-xs font-medium mb-2">
                  اسم المسؤول / مدير المركز
                </label>
                <input
                  type="text"
                  value={formData.manager_name}
                  onChange={(e) => handleChange("manager_name", e.target.value)}
                  placeholder="مثال: الشيخ أحمد محمود"
                  className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 text-sm"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-mist-400 text-xs font-medium mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 text-sm text-right"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-mist-400 text-xs font-medium mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="info@center.com"
                  className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 text-sm text-right"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-mist-400 text-xs font-medium mb-2">
                  العنوان
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="مثال: القاهرة، حي المعادي"
                  className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2 — SUBSCRIPTION SETTINGS */}
          <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-6">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-navy-700">
              <div className="h-9 w-9 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center font-bold">
                💳
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-parchment-100">
                  إعدادات الاشتراكات
                </h2>
                <p className="text-mist-400 text-xs mt-0.5">
                  تحديد القيمة والعملة الافتراضية عند تسجيل اشتراكات جديدة للطلاب
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Default Amount */}
              <div>
                <label className="block text-mist-400 text-xs font-medium mb-2">
                  قيمة الاشتراك الشهرية الافتراضية <span className="text-rust-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formData.default_subscription_amount}
                    onChange={(e) =>
                      handleChange("default_subscription_amount", e.target.value)
                    }
                    className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 text-sm pl-16"
                  />
                  <span className="absolute left-3 top-2.5 text-mist-400 text-xs font-medium pointer-events-none">
                    {formData.currency === "EGP" ? "جنيه" : formData.currency}
                  </span>
                </div>
                <p className="text-mist-500 text-[11px] mt-1.5">
                  هذه القيمة تُقترح تلقائياً عند تسجيل اشتراك جديد، ولا تعدل الاشتراكات السابقة.
                </p>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-mist-400 text-xs font-medium mb-2">
                  العملة
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                  className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3.5 py-2.5 text-parchment-100 outline-none focus:border-gold-500 text-sm"
                >
                  <option value="EGP">جنيه مصري (EGP)</option>
                </select>
                <p className="text-mist-500 text-[11px] mt-1.5">
                  العملة المستخدمة في عرض المبالغ المالية وتقارير التحصيل.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3 — SYSTEM STATUS */}
          <div className="bg-navy-800/70 border border-navy-600 rounded-2xl p-6">
            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-navy-700">
              <div className="h-9 w-9 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center font-bold">
                ⚙️
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-parchment-100">
                  معلومات النظام
                </h2>
                <p className="text-mist-400 text-xs mt-0.5">
                  بيانات بنية التشغيل والحالة الفنية
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-navy-900/60 border border-navy-700 rounded-xl p-4">
                <p className="text-mist-400 text-xs mb-1">نمط التشغيل</p>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span className="text-parchment-100 font-medium text-sm">
                    مركز فردي (Single-Center)
                  </span>
                </div>
              </div>

              <div className="bg-navy-900/60 border border-navy-700 rounded-xl p-4">
                <p className="text-mist-400 text-xs mb-1">آخر تحديث للإعدادات</p>
                <span className="text-parchment-100 font-medium text-sm">
                  {formattedUpdatedAt}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={loadSettings}
              disabled={saving}
              className="bg-navy-800 border border-navy-600 hover:border-gold-500/40 text-mist-300 hover:text-parchment-100 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              إلغاء التغييرات
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-7 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-60 shadow-lg"
            >
              {saving ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <span>حفظ التعديلات</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}
