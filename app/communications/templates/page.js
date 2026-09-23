"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  listTemplates,
  updateTemplate,
  deleteTemplate,
} from "@/lib/communications";
import AuthGuard from "@/components/AuthGuard";
import { useToast } from "@/components/ToastProvider";
import { SkeletonRow } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import TemplateFormModal from "@/components/TemplateFormModal";

function TemplatesContent() {
  const router = useRouter();
  const { addToast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const { data, error: err } = await listTemplates();
      if (err) throw err;
      setTemplates(data || []);
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

  async function toggleActive(template) {
    const { error: err } = await updateTemplate(template.id, {
      is_active: !template.is_active,
    });
    if (err) {
      addToast("حصل خطأ، حاول تاني", "error");
    } else {
      addToast(template.is_active ? "تم إيقاف القالب" : "تم تفعيل القالب", "success");
      load();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const { error: err } = await deleteTemplate(deleteTarget.id);
    setDeleteLoading(false);
    setDeleteTarget(null);
    if (err) {
      addToast("تعذر حذف القالب", "error");
    } else {
      addToast("تم حذف القالب", "success");
      load();
    }
  }

  return (
    <div>
      <button
        onClick={() => router.push("/communications")}
        className="text-sm text-mist-400 hover:text-gold-400 mb-5 transition-colors"
      >
        → رجوع لمركز التواصل
      </button>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display font-bold text-3xl text-parchment-100 glow-text-gold">
          قوالب الرسائل
        </h1>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-5 py-2.5 rounded-lg text-sm font-bold"
        >
          + قالب جديد
        </button>
      </div>

      {error && (
        <div className="mb-6 border border-rust-500/30 bg-rust-100 text-rust-500 rounded-xl px-5 py-4 text-sm">
          حصل خطأ في تحميل القوالب.
        </div>
      )}

      {loading ? (
        <div className="border border-navy-600 rounded-2xl bg-navy-800/50 divide-y divide-navy-700 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          title="لا توجد قوالب"
          description="أنشئ قالباً لإعادة استخدامه في الرسائل."
          actionLabel="+ قالب جديد"
          onAction={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="divide-y divide-navy-700 border border-navy-600 rounded-2xl bg-navy-800/50 overflow-hidden">
          {templates.map((t) => (
            <div key={t.id} className="px-5 py-4 flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-parchment-100">{t.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy-700 text-mist-400">
                    {t.category}
                  </span>
                  {!t.is_active && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rust-100 text-rust-500">
                      متوقف
                    </span>
                  )}
                </div>
                <p className="text-xs text-mist-500 mt-1">{t.title}</p>
                <p className="text-xs text-mist-500 mt-1 line-clamp-2 whitespace-pre-wrap">
                  {t.body}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/communications"
                  className="text-xs px-3 py-1.5 rounded-lg text-gold-400 hover:bg-navy-700"
                >
                  استخدام
                </Link>
                <button
                  onClick={() => {
                    setEditing(t);
                    setModalOpen(true);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg text-mist-400 hover:text-gold-400 hover:bg-navy-700"
                >
                  تعديل
                </button>
                <button
                  onClick={() => toggleActive(t)}
                  className="text-xs px-3 py-1.5 rounded-lg text-mist-400 hover:text-parchment-100 hover:bg-navy-700"
                >
                  {t.is_active ? "إيقاف" : "تفعيل"}
                </button>
                <button
                  onClick={() => setDeleteTarget(t)}
                  className="text-xs px-3 py-1.5 rounded-lg text-mist-400 hover:text-rust-500 hover:bg-navy-700"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TemplateFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        editingTemplate={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف القالب"
        message={`هل تريد حذف قالب "${deleteTarget?.name}"؟`}
        confirmLabel="حذف"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <AuthGuard>
      <TemplatesContent />
    </AuthGuard>
  );
}
