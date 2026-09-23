"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const links = [
  {
    href: "/",
    label: "الرئيسية",
    icon: (
      <>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5 10v9.5a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
      </>
    ),
  },
  {
    href: "/halaqat",
    label: "الحلقات",
    icon: (
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
    ),
  },
  {
    href: "/teachers",
    label: "المحفظون",
    icon: (
      <>
        <path d="M22 10 12 5 2 10l10 5 10-5Z" />
        <path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" />
      </>
    ),
  },
  {
    href: "/students",
    label: "الطلاب",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
        <path d="M15.5 8.2a3 3 0 1 1 0 5.6" />
        <path d="M17.5 14.6c2 .4 3 2 3 5.4" />
      </>
    ),
  },
  {
    href: "/guardians",
    label: "أولياء الأمور",
    icon: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 20c0-3.2 2.4-5.3 5.5-5.3S14 16.8 14 20" />
        <circle cx="17" cy="8" r="2.4" />
        <path d="M14.5 20c.3-2.2 1.8-3.8 4-4.2" />
      </>
    ),
  },
  {
    href: "/communications",
    label: "مركز التواصل",
    icon: (
      <>
        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
      </>
    ),
  },
  // === Sprint 2: Quran Management ===
  {
    href: "/memorization",
    label: "التسميع والحفظ",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    ),
  },
  {
    href: "/revision",
    label: "المراجعة",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
      />
    ),
  },
  {
    href: "/exams",
    label: "الاختبارات",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 011.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C6.095 4.1 4.5 5.907 4.5 8.054v9.946a2 2 0 002 2h9a2 2 0 002-2V8.054c0-2.147-1.595-3.954-3.726-4.138a48.27 48.27 0 00-1.124-.08m-5.8 0c-.376.023-.75.05-1.124.08M9 14.25l2.25 2.25L15 12"
      />
    ),
  },
  {
    href: "/subscriptions",
    label: "الاشتراكات",
    icon: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </>
    ),
  },
  {
    href: "/settings",
    label: "الإعدادات",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
  },
];

export default function Sidebar({ mobileOpen = false, onMobileClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hijriDate, setHijriDate] = useState("");

  useEffect(() => {
    try {
      setHijriDate(
        new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date())
      );
    } catch {
      setHijriDate("");
    }
  }, []);

  // إغلاق القائمة تلقائيًا عند تغيير الصفحة (موبايل)
  useEffect(() => {
    onMobileClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* خلفية معتمة خلف القائمة على الموبايل */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/70 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 h-screen w-64 shrink-0 bg-navy-950 border-l border-navy-700 flex flex-col
          transition-transform duration-200 lg:static lg:translate-x-0
          ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
      >
        <div className="px-6 py-7 border-b border-navy-700 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full border border-gold-500/40 flex items-center justify-center text-gold-400 font-display glow-gold shrink-0">
            ق
          </div>
          <div>
            <p className="font-display font-bold text-parchment-100 text-sm leading-tight">
              مركز التحفيظ
            </p>
            <p className="text-mist-500 text-xs">لوحة الإداري</p>
            {hijriDate && (
              <p className="text-gold-500/50 text-[10px] mt-0.5">{hijriDate}</p>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-gold-500/10 text-gold-400 border border-gold-500/20 glow-border-gold"
                    : "text-mist-400 hover:bg-navy-800 hover:text-parchment-100"
                }`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  {link.icon}
                </svg>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-5 border-t border-navy-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-mist-400 hover:text-rust-500 hover:bg-navy-800 transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            تسجيل خروج
          </button>
        </div>
      </aside>
    </>
  );
}
