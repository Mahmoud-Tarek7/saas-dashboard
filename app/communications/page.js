"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  listCommunications,
  statusLabel,
  channelLabel,
} from "@/lib/communications";
import AuthGuard from "@/components/AuthGuard";
import { SkeletonRow } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import MessageComposerModal from "@/components/MessageComposerModal";

function CommunicationsContent() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [tab, setTab] = useState("history");

  const load = useCallback(async () => {
    setError(false);
    try {
      const { data, error: err } = await listCommunications();
      if (err) throw err;
      setMessages(data || []);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display font-bold text-3xl text-parchment-100 glow-text-gold">
          مركز التواصل
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/communications/templates"
            className="bg-navy-800 border border-navy-600 hover:border-gold-500/40 text-parchment-100 px-4 py-2.5 rounded-lg text-sm"
          >
            القوالب
          </Link>
          <button
            onClick={() => setComposerOpen(true)}
            className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-5 py-2.5 rounded-lg text-sm font-bold"
          >
            إرسال رسالة جديدة
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setTab("compose")}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            tab === "compose"
              ? "bg-gold-500/10 text-gold-400 border border-gold-500/20"
              : "text-mist-400 hover:text-parchment-100"
          }`}
        >
          إرسال رسالة جديدة
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            tab === "history"
              ? "bg-gold-500/10 text-gold-400 border border-gold-500/20"
              : "text-mist-400 hover:text-parchment-100"
          }`}
        >
          سجل الرسائل
        </button>
        <Link
          href="/communications/templates"
          className="px-4 py-2 rounded-lg text-sm text-mist-400 hover:text-parchment-100"
        >
          القوالب
        </Link>
      </div>

      {tab === "compose" && (
        <div className="border border-navy-600 rounded-2xl bg-navy-800/50 p-6 mb-6">
          <p className="text-parchment-100 font-medium mb-2">إنشاء رسالة لأولياء الأمور</p>
          <p className="text-mist-500 text-sm mb-4">
            قنوات SMS و WhatsApp والبريد غير متصلة حالياً. يمكنك حفظ رسائل داخل التطبيق
            واستخدام السجل لاحقاً عند ربط المزودين.
          </p>
          <button
            onClick={() => setComposerOpen(true)}
            className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-5 py-2.5 rounded-lg text-sm font-bold"
          >
            فتح محرر الرسائل
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 border border-rust-500/30 bg-rust-100 text-rust-500 rounded-xl px-5 py-4 text-sm">
          حصل خطأ في تحميل سجل الرسائل.
        </div>
      )}

      <h2 className="font-display font-bold text-xl text-parchment-100 mb-4">سجل الرسائل</h2>

      {loading ? (
        <div className="border border-navy-600 rounded-2xl bg-navy-800/50 divide-y divide-navy-700 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <EmptyState
          title="لا توجد رسائل بعد"
          description="أنشئ أول رسالة لأولياء الأمور."
          actionLabel="إرسال رسالة جديدة"
          onAction={() => setComposerOpen(true)}
        />
      ) : (
        <div className="divide-y divide-navy-700 border border-navy-600 rounded-2xl bg-navy-800/50 overflow-hidden">
          {messages.map((m) => (
            <div key={m.id} className="px-5 py-4 hover:bg-navy-800 transition-colors">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-medium text-parchment-100">{m.title}</p>
                  <p className="text-xs text-mist-500 mt-1 line-clamp-2 whitespace-pre-wrap">
                    {m.body}
                  </p>
                  <p className="text-[11px] text-mist-500 mt-2">
                    {channelLabel(m.channel)} · {m.recipient_count} مستلم ·{" "}
                    {m.created_at
                      ? new Date(m.created_at).toLocaleString("ar-EG")
                      : ""}
                  </p>
                </div>
                <span
                  className={`text-[10px] px-2.5 py-1 rounded-full border shrink-0 ${
                    m.status === "stored"
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : m.status === "provider_unavailable"
                        ? "bg-rust-100 text-rust-500 border-rust-500/20"
                        : "bg-navy-700 text-mist-400 border-navy-600"
                  }`}
                >
                  {statusLabel(m.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <MessageComposerModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSaved={() => {
          setTab("history");
          load();
        }}
      />
    </div>
  );
}

export default function CommunicationsPage() {
  return (
    <AuthGuard>
      <CommunicationsContent />
    </AuthGuard>
  );
}
