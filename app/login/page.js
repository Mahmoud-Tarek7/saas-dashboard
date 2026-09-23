"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("البيانات غير صحيحة. تأكد من البريد وكلمة المرور.");
      return;
    }

    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* زخرفة خلفية هندسية بسيطة */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gold-500/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gold-500/5 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-gold-500/40 bg-navy-800 text-gold-400 font-display text-2xl mb-5 shadow-[0_0_0_4px_rgba(212,175,55,0.08)]">
            ق
          </div>
          <h1 className="font-display font-bold text-3xl text-parchment-100 mb-1.5">
            مركز تحفيظ القرآن الكريم
          </h1>
          <p className="text-mist-400 text-sm">تسجيل دخول الإداري</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-navy-800/60 backdrop-blur border border-navy-600 rounded-2xl p-7 space-y-5 shadow-2xl"
        >
          <div>
            <label className="block text-sm text-mist-400 mb-2">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-3 text-parchment-100 placeholder:text-mist-500 focus:border-gold-500 outline-none transition-colors"
              placeholder="admin@example.com"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm text-mist-400 mb-2">
              كلمة المرور
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-3 text-parchment-100 placeholder:text-mist-500 focus:border-gold-500 outline-none transition-colors"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          {error && (
            <p className="text-rust-500 text-sm bg-rust-100 border border-rust-500/20 rounded-lg px-3.5 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950 rounded-lg py-3 font-bold transition-colors disabled:opacity-60"
          >
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>

        <p className="text-center text-mist-500 text-xs mt-6 font-display">
          « وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا »
        </p>
      </div>
    </div>
  );
}
