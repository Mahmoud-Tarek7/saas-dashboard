"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CHANNELS,
  SEGMENT_OPTIONS,
  resolveRecipients,
  createCommunication,
  listTemplates,
  applyMessageVariables,
  isChannelConnected,
} from "@/lib/communications";
import { useToast } from "@/components/ToastProvider";

export default function MessageComposerModal({ open, onClose, onSaved }) {
  const { addToast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState("in_app");
  const [segmentType, setSegmentType] = useState("all");
  const [halaqaId, setHalaqaId] = useState("");
  const [guardianId, setGuardianId] = useState("");
  const [manualIds, setManualIds] = useState([]);
  const [halaqat, setHalaqat] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [resolved, setResolved] = useState([]);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setBody("");
    setChannel("in_app");
    setSegmentType("all");
    setHalaqaId("");
    setGuardianId("");
    setManualIds([]);
    setErrors({});
    setResolved([]);
    setPreviewCount(0);

    Promise.all([
      supabase.from("halaqat").select("id, name").order("name"),
      supabase.from("guardians").select("id, name, phone, is_active").eq("is_active", true).order("name"),
      listTemplates({ activeOnly: true }),
    ]).then(([hRes, gRes, tRes]) => {
      setHalaqat(hRes.data || []);
      setGuardians(gRes.data || []);
      setTemplates(tRes.data || []);
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function preview() {
      setResolving(true);
      const { data, error } = await resolveRecipients({
        segmentType,
        halaqaId,
        guardianId,
        manualGuardianIds: manualIds,
      });
      if (cancelled) return;
      if (error) {
        setResolved([]);
        setPreviewCount(0);
      } else {
        setResolved(data || []);
        const unique = new Set((data || []).map((r) => r.guardian?.id).filter(Boolean));
        setPreviewCount(unique.size);
      }
      setResolving(false);
    }

    const t = setTimeout(preview, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, segmentType, halaqaId, guardianId, manualIds]);

  const samplePreview = useMemo(() => {
    const sample = resolved[0];
    if (!sample) return body;
    return applyMessageVariables(body, {
      guardian_name: sample.guardian?.name,
      student_name: sample.student?.name,
      halaqa_name: sample.halaqa?.name,
      teacher_name: sample.halaqa?.teacher_name,
    });
  }, [body, resolved]);

  function applyTemplate(templateId) {
    const t = templates.find((x) => x.id === templateId);
    if (!t) return;
    setTitle(t.title);
    setBody(t.body);
  }

  function toggleManual(id) {
    setManualIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function validate() {
    const e = {};
    if (!title.trim()) e.title = "عنوان الرسالة مطلوب";
    if (!body.trim()) e.body = "نص الرسالة مطلوب";
    if (segmentType === "halaqa" && !halaqaId) e.segment = "اختر الحلقة";
    if (segmentType === "specific" && !guardianId) e.segment = "اختر ولي الأمر";
    if (segmentType === "manual" && manualIds.length === 0) e.segment = "اختر ولي أمر واحد على الأقل";
    if (previewCount === 0) e.recipients = "لا يوجد مستلمون لهذا الاختيار";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    const { data, error } = await createCommunication({
      title: title.trim(),
      body: body.trim(),
      channel,
      segmentType,
      segmentMeta: { halaqaId, guardianId, manualIds },
      recipients: resolved,
    });

    setSaving(false);

    if (error) {
      addToast("حصل خطأ أثناء حفظ الرسالة", "error");
      return;
    }

    if (!isChannelConnected(channel)) {
      addToast(
        `تم حفظ الرسالة في السجل، لكن قناة ${CHANNELS.find((c) => c.id === channel)?.label} غير متصلة حالياً — لم يتم الإرسال الخارجي`,
        "error"
      );
    } else {
      addToast(`تم حفظ الرسالة داخل التطبيق لـ ${data.recipient_count} ولي أمر`, "success");
    }

    onSaved();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy-950/70 backdrop-blur-sm px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-navy-800 border border-navy-600 rounded-2xl p-6 max-w-2xl w-full space-y-4 max-h-[92vh] overflow-y-auto"
      >
        <h3 className="font-display font-bold text-lg text-parchment-100">إرسال رسالة جديدة</h3>

        {templates.length > 0 && (
          <div>
            <label className="block text-sm text-mist-400 mb-2">استخدام قالب</label>
            <select
              defaultValue=""
              onChange={(e) => applyTemplate(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
            >
              <option value="">بدون قالب</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm text-mist-400 mb-2">طريقة الإرسال</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CHANNELS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannel(c.id)}
                className={`rounded-lg border px-3 py-2.5 text-xs text-right transition-colors ${
                  channel === c.id
                    ? "border-gold-500/40 bg-gold-500/10 text-gold-400"
                    : "border-navy-600 bg-navy-900 text-mist-400 hover:text-parchment-100"
                }`}
              >
                <span className="block font-medium">{c.label}</span>
                {!c.connected && <span className="text-[10px] text-rust-500">غير متصل حالياً</span>}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-mist-400 mb-2">المستلمون</label>
          <select
            value={segmentType}
            onChange={(e) => setSegmentType(e.target.value)}
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
          >
            {SEGMENT_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-mist-500 mt-1.5">
            ملاحظة: فلتر «مستوى معين» غير متاح لأن قاعدة البيانات لا تحتوي حقل مستوى للطلاب حالياً.
          </p>
        </div>

        {segmentType === "halaqa" && (
          <select
            value={halaqaId}
            onChange={(e) => setHalaqaId(e.target.value)}
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
          >
            <option value="">اختر الحلقة</option>
            {halaqat.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        )}

        {segmentType === "specific" && (
          <select
            value={guardianId}
            onChange={(e) => setGuardianId(e.target.value)}
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
          >
            <option value="">اختر ولي الأمر</option>
            {guardians.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.phone ? ` — ${g.phone}` : ""}
              </option>
            ))}
          </select>
        )}

        {segmentType === "manual" && (
          <div className="max-h-40 overflow-y-auto border border-navy-600 rounded-lg divide-y divide-navy-700">
            {guardians.map((g) => (
              <label
                key={g.id}
                className="flex items-center gap-3 px-3 py-2 text-sm text-parchment-100 cursor-pointer hover:bg-navy-900"
              >
                <input
                  type="checkbox"
                  checked={manualIds.includes(g.id)}
                  onChange={() => toggleManual(g.id)}
                />
                <span>
                  {g.name}
                  {g.phone ? ` · ${g.phone}` : ""}
                </span>
              </label>
            ))}
          </div>
        )}

        <p className="text-xs text-mist-400">
          {resolving ? "جاري حساب المستلمين..." : `عدد أولياء الأمور: ${previewCount}`}
        </p>
        {errors.segment && <p className="text-rust-500 text-xs">{errors.segment}</p>}
        {errors.recipients && <p className="text-rust-500 text-xs">{errors.recipients}</p>}

        <div>
          <label className="block text-sm text-mist-400 mb-2">عنوان الرسالة</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500"
          />
          {errors.title && <p className="text-rust-500 text-xs mt-1.5">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm text-mist-400 mb-2">نص الرسالة</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-parchment-100 outline-none focus:border-gold-500 resize-none"
            placeholder="يمكنك استخدام: {guardian_name} {student_name} {halaqa_name} {teacher_name}"
          />
          {errors.body && <p className="text-rust-500 text-xs mt-1.5">{errors.body}</p>}
        </div>

        {body && (
          <div className="rounded-xl border border-navy-700 bg-navy-900/60 p-4">
            <p className="text-xs text-mist-500 mb-2">معاينة بعد استبدال المتغيرات</p>
            <p className="text-sm text-parchment-100 whitespace-pre-wrap">{samplePreview}</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || resolving}
            className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-6 py-2.5 rounded-lg text-sm font-bold disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : isChannelConnected(channel) ? "حفظ الرسالة" : "حفظ بدون إرسال خارجي"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm text-mist-400 hover:text-parchment-100"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
