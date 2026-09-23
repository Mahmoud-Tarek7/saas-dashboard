import { supabase } from "./supabase";
import { getTodayDate } from "./date";

export const CHANNELS = [
  { id: "in_app", label: "داخل التطبيق", connected: true },
  { id: "sms", label: "SMS", connected: false },
  { id: "whatsapp", label: "WhatsApp", connected: false },
  { id: "email", label: "البريد الإلكتروني", connected: false },
];

export const SEGMENT_OPTIONS = [
  { id: "all", label: "جميع أولياء الأمور" },
  { id: "halaqa", label: "أولياء أمور حلقة معينة" },
  { id: "specific", label: "ولي أمر محدد" },
  { id: "absent_today", label: "أولياء أمور الطلاب الغائبين اليوم" },
  { id: "low_performance", label: "أولياء أمور الطلاب ذوي الأداء المنخفض" },
  { id: "manual", label: "اختيار أولياء الأمور يدوياً" },
];

export function isChannelConnected(channel) {
  return CHANNELS.find((c) => c.id === channel)?.connected === true;
}

export function applyMessageVariables(text, vars = {}) {
  if (!text) return "";
  return text
    .replace(/\{guardian_name\}/g, vars.guardian_name || "ولي الأمر")
    .replace(/\{student_name\}/g, vars.student_name || "الطالب")
    .replace(/\{halaqa_name\}/g, vars.halaqa_name || "الحلقة")
    .replace(/\{teacher_name\}/g, vars.teacher_name || "المحفظ");
}

/**
 * Resolve guardian recipients from a segment using live data.
 * Returns [{ guardian, student, halaqa }]
 */
export async function resolveRecipients({ segmentType, halaqaId, guardianId, manualGuardianIds = [] }) {
  if (segmentType === "all") {
    const { data: guardians, error } = await supabase
      .from("guardians")
      .select("id, name, phone, is_active")
      .eq("is_active", true);
    if (error) return { data: null, error };

    const { data: links } = await supabase
      .from("guardian_students")
      .select("guardian_id, student_id, students(id, name, halaqa_id, halaqat(name, teacher_name))")
      .in(
        "guardian_id",
        (guardians || []).map((g) => g.id)
      );

    return {
      data: expandRecipients(guardians || [], links || []),
      error: null,
    };
  }

  if (segmentType === "specific" && guardianId) {
    const { data: guardian, error } = await supabase
      .from("guardians")
      .select("id, name, phone, is_active")
      .eq("id", guardianId)
      .single();
    if (error) return { data: null, error };

    const { data: links } = await supabase
      .from("guardian_students")
      .select("guardian_id, student_id, students(id, name, halaqa_id, halaqat(name, teacher_name))")
      .eq("guardian_id", guardianId);

    return { data: expandRecipients([guardian], links || []), error: null };
  }

  if (segmentType === "manual") {
    if (!manualGuardianIds?.length) return { data: [], error: null };
    const { data: guardians, error } = await supabase
      .from("guardians")
      .select("id, name, phone, is_active")
      .in("id", manualGuardianIds);
    if (error) return { data: null, error };

    const { data: links } = await supabase
      .from("guardian_students")
      .select("guardian_id, student_id, students(id, name, halaqa_id, halaqat(name, teacher_name))")
      .in("guardian_id", manualGuardianIds);

    return { data: expandRecipients(guardians || [], links || []), error: null };
  }

  if (segmentType === "halaqa" && halaqaId) {
    const { data: students, error: sErr } = await supabase
      .from("students")
      .select("id, name, halaqa_id, halaqat(name, teacher_name)")
      .eq("halaqa_id", halaqaId)
      .eq("is_active", true);
    if (sErr) return { data: null, error: sErr };

    const studentIds = (students || []).map((s) => s.id);
    if (studentIds.length === 0) return { data: [], error: null };

    const { data: links, error } = await supabase
      .from("guardian_students")
      .select("guardian_id, student_id, guardians(id, name, phone, is_active)")
      .in("student_id", studentIds);
    if (error) return { data: null, error };

    const studentMap = Object.fromEntries((students || []).map((s) => [s.id, s]));
    const rows = (links || [])
      .filter((l) => l.guardians?.is_active !== false)
      .map((l) => ({
        guardian: l.guardians,
        student: studentMap[l.student_id],
        halaqa: studentMap[l.student_id]?.halaqat || null,
      }))
      .filter((r) => r.guardian);

    return { data: dedupeRecipientRows(rows), error: null };
  }

  if (segmentType === "absent_today") {
    const today = getTodayDate();
    const { data: absences, error: aErr } = await supabase
      .from("attendance")
      .select("student_id, students(id, name, halaqa_id, is_active, halaqat(name, teacher_name))")
      .eq("date", today)
      .eq("status", "absent");
    if (aErr) return { data: null, error: aErr };

    const students = (absences || [])
      .map((a) => a.students)
      .filter((s) => s && s.is_active !== false);
    const studentIds = students.map((s) => s.id);
    if (studentIds.length === 0) return { data: [], error: null };

    const { data: links, error } = await supabase
      .from("guardian_students")
      .select("guardian_id, student_id, guardians(id, name, phone, is_active)")
      .in("student_id", studentIds);
    if (error) return { data: null, error };

    const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));
    const rows = (links || [])
      .filter((l) => l.guardians?.is_active !== false)
      .map((l) => ({
        guardian: l.guardians,
        student: studentMap[l.student_id],
        halaqa: studentMap[l.student_id]?.halaqat || null,
      }))
      .filter((r) => r.guardian);

    return { data: dedupeRecipientRows(rows), error: null };
  }

  if (segmentType === "low_performance") {
    // Supported metric: average memorization rating < 3 across existing records
    const { data: mems, error: mErr } = await supabase
      .from("memorization_records")
      .select("student_id, rating");
    if (mErr) return { data: null, error: mErr };

    const buckets = {};
    (mems || []).forEach((m) => {
      if (!buckets[m.student_id]) buckets[m.student_id] = [];
      buckets[m.student_id].push(m.rating || 0);
    });

    const lowIds = Object.entries(buckets)
      .filter(([, ratings]) => {
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        return avg < 3;
      })
      .map(([id]) => id);

    if (lowIds.length === 0) return { data: [], error: null };

    const { data: students } = await supabase
      .from("students")
      .select("id, name, halaqa_id, is_active, halaqat(name, teacher_name)")
      .in("id", lowIds)
      .eq("is_active", true);

    const { data: links, error } = await supabase
      .from("guardian_students")
      .select("guardian_id, student_id, guardians(id, name, phone, is_active)")
      .in("student_id", lowIds);
    if (error) return { data: null, error };

    const studentMap = Object.fromEntries((students || []).map((s) => [s.id, s]));
    const rows = (links || [])
      .filter((l) => l.guardians?.is_active !== false && studentMap[l.student_id])
      .map((l) => ({
        guardian: l.guardians,
        student: studentMap[l.student_id],
        halaqa: studentMap[l.student_id]?.halaqat || null,
      }));

    return { data: dedupeRecipientRows(rows), error: null };
  }

  return { data: [], error: null };
}

function expandRecipients(guardians, links) {
  const byGuardian = {};
  (links || []).forEach((l) => {
    if (!byGuardian[l.guardian_id]) byGuardian[l.guardian_id] = [];
    byGuardian[l.guardian_id].push(l);
  });

  const rows = [];
  guardians.forEach((g) => {
    const gLinks = byGuardian[g.id] || [];
    if (gLinks.length === 0) {
      rows.push({ guardian: g, student: null, halaqa: null });
      return;
    }
    gLinks.forEach((l) => {
      rows.push({
        guardian: g,
        student: l.students || null,
        halaqa: l.students?.halaqat || null,
      });
    });
  });
  return dedupeRecipientRows(rows);
}

function dedupeRecipientRows(rows) {
  const seen = new Set();
  return rows.filter((r) => {
    const key = `${r.guardian?.id || ""}:${r.student?.id || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Store a communication. External channels are never marked as successfully delivered.
 */
export async function createCommunication({
  title,
  body,
  channel,
  segmentType,
  segmentMeta = {},
  recipients,
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const connected = isChannelConnected(channel);
  const messageStatus = connected ? "stored" : "provider_unavailable";
  const recipientStatus = connected ? "stored" : "provider_unavailable";

  const uniqueGuardianIds = [...new Set(recipients.map((r) => r.guardian?.id).filter(Boolean))];

  const { data: message, error: msgErr } = await supabase
    .from("communication_messages")
    .insert({
      title,
      body,
      channel,
      status: messageStatus,
      segment_type: segmentType,
      segment_meta: segmentMeta,
      recipient_count: uniqueGuardianIds.length,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (msgErr) return { data: null, error: msgErr };

  if (recipients.length > 0) {
    const rows = recipients.map((r) => {
      const vars = {
        guardian_name: r.guardian?.name,
        student_name: r.student?.name,
        halaqa_name: r.halaqa?.name,
        teacher_name: r.halaqa?.teacher_name,
      };
      return {
        message_id: message.id,
        guardian_id: r.guardian.id,
        student_id: r.student?.id || null,
        rendered_title: applyMessageVariables(title, vars),
        rendered_body: applyMessageVariables(body, vars),
        status: recipientStatus,
      };
    });

    const { error: recErr } = await supabase.from("communication_recipients").insert(rows);
    if (recErr) return { data: message, error: recErr };
  }

  return {
    data: {
      ...message,
      provider_connected: connected,
    },
    error: null,
  };
}

export async function listCommunications() {
  const { data, error } = await supabase
    .from("communication_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return { data, error };
}

export async function listTemplates({ activeOnly = false } = {}) {
  let query = supabase.from("message_templates").select("*").order("created_at", { ascending: false });
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  return { data, error };
}

export async function createTemplate(fields) {
  const { data, error } = await supabase
    .from("message_templates")
    .insert({
      name: fields.name,
      title: fields.title,
      body: fields.body,
      category: fields.category || "general",
      is_active: fields.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  return { data, error };
}

export async function updateTemplate(id, fields) {
  const { data, error } = await supabase
    .from("message_templates")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteTemplate(id) {
  const { error } = await supabase.from("message_templates").delete().eq("id", id);
  return { error };
}

export function statusLabel(status) {
  const map = {
    draft: "مسودة",
    queued: "في الانتظار",
    stored: "محفوظة (داخل التطبيق)",
    provider_unavailable: "غير متصل بمزود إرسال",
    failed: "فشل",
  };
  return map[status] || status;
}

export function channelLabel(channel) {
  return CHANNELS.find((c) => c.id === channel)?.label || channel;
}
