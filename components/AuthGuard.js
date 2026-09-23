"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "./Sidebar";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
      } else {
        setChecked(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-mist-400">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* شريط علوي للموبايل بس - فيه زرار فتح القائمة */}
        <header className="lg:hidden sticky top-0 z-30 bg-navy-950/90 backdrop-blur border-b border-navy-700 px-4 py-3.5 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-parchment-100 p-1.5 -mr-1.5"
            aria-label="فتح القائمة"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span className="font-display font-bold text-parchment-100 text-sm">
            مركز التحفيظ
          </span>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-9 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
