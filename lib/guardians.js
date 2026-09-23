import { supabase } from "./supabase";

export async function createGuardian(fields) {
  const payload = {
    name: fields.name,
    phone: fields.phone || null,
    secondary_phone: fields.secondary_phone || null,
    email: fields.email || null,
    address: fields.address || null,
    notes: fields.notes || null,
    is_active: fields.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("guardians")
    .insert(payload)
    .select()
    .single();

  return { data, error };
}

export async function updateGuardian(id, fields) {
  const payload = {
    ...fields,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("guardians")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function setGuardianActive(id, isActive) {
  return updateGuardian(id, { is_active: isActive });
}

export async function linkGuardianStudent({
  guardian_id,
  student_id,
  relationship = "parent",
  is_primary = false,
}) {
  const { data, error } = await supabase
    .from("guardian_students")
    .insert({
      guardian_id,
      student_id,
      relationship,
      is_primary,
    })
    .select()
    .single();

  return { data, error };
}

export async function unlinkGuardianStudent(linkId) {
  const { error } = await supabase.from("guardian_students").delete().eq("id", linkId);
  return { error };
}

export async function findGuardianByPhone(phone) {
  if (!phone) return { data: null, error: null };
  const { data, error } = await supabase
    .from("guardians")
    .select("id, name, phone")
    .eq("phone", phone)
    .maybeSingle();
  return { data, error };
}

/**
 * Load guardians with linked children (batch, avoids N+1).
 */
export async function listGuardiansWithChildren({ search = "", status = "all" } = {}) {
  let query = supabase.from("guardians").select("*").order("name");

  if (status === "active") query = query.eq("is_active", true);
  if (status === "inactive") query = query.eq("is_active", false);

  if (search.trim()) {
    const safe = search.trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    query = query.or(`name.ilike."%${safe}%",phone.ilike."%${safe}%",secondary_phone.ilike."%${safe}%"`);
  }

  const { data: guardians, error } = await query;
  if (error) return { data: null, error };

  const ids = (guardians || []).map((g) => g.id);
  if (ids.length === 0) return { data: [], error: null };

  const { data: links, error: linksErr } = await supabase
    .from("guardian_students")
    .select("id, guardian_id, student_id, relationship, is_primary, students(id, name, is_active)")
    .in("guardian_id", ids);

  if (linksErr) return { data: null, error: linksErr };

  const byGuardian = {};
  (links || []).forEach((link) => {
    if (!byGuardian[link.guardian_id]) byGuardian[link.guardian_id] = [];
    byGuardian[link.guardian_id].push(link);
  });

  const enriched = (guardians || []).map((g) => {
    const children = byGuardian[g.id] || [];
    return {
      ...g,
      children,
      children_count: children.length,
      children_names: children.map((c) => c.students?.name).filter(Boolean),
    };
  });

  return { data: enriched, error: null };
}

/**
 * Aggregate child academic/attendance/subscription summary for guardian profile.
 */
export async function getGuardianChildSummaries(guardianId) {
  const { data: links, error: linksErr } = await supabase
    .from("guardian_students")
    .select(
      "id, relationship, is_primary, students(id, name, is_active, parent_phone, halaqa_id, join_date, halaqat(id, name, teacher_name, type, section, is_active))"
    )
    .eq("guardian_id", guardianId)
    .order("created_at");

  if (linksErr) return { data: null, error: linksErr };

  const students = (links || [])
    .map((l) => ({
      link_id: l.id,
      relationship: l.relationship,
      is_primary: l.is_primary,
      ...(l.students || {}),
    }))
    .filter((s) => s.id);

  if (students.length === 0) return { data: [], error: null };

  const studentIds = students.map((s) => s.id);
  const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const [
    { data: attendance },
    { data: memRecords },
    { data: revRecords },
    { data: exams },
    { data: subscriptions },
  ] = await Promise.all([
    supabase.from("attendance").select("student_id, status, date").in("student_id", studentIds),
    supabase
      .from("memorization_records")
      .select("student_id, date, surah_name, from_ayah, to_ayah, rating, created_at")
      .in("student_id", studentIds)
      .order("date", { ascending: false }),
    supabase
      .from("revision_records")
      .select("student_id, date, surah_name, from_ayah, to_ayah, mastery_level, created_at")
      .in("student_id", studentIds)
      .order("date", { ascending: false }),
    supabase
      .from("exams")
      .select("student_id, date, exam_name, total_score, grade, created_at")
      .in("student_id", studentIds)
      .order("date", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("student_id, month, amount, payment_date, payment_method")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false }),
  ]);

  const summaries = students.map((student) => {
    const att = (attendance || []).filter((a) => a.student_id === student.id);
    const present = att.filter((a) => a.status === "present").length;
    const absent = att.filter((a) => a.status === "absent").length;
    const totalAtt = present + absent;
    const attendancePct = totalAtt > 0 ? Math.round((present / totalAtt) * 100) : null;

    const mems = (memRecords || []).filter((m) => m.student_id === student.id);
    const revs = (revRecords || []).filter((r) => r.student_id === student.id);
    const exs = (exams || []).filter((e) => e.student_id === student.id);
    const subs = (subscriptions || []).filter((s) => s.student_id === student.id);

    const avgMem =
      mems.length > 0
        ? Math.round((mems.reduce((sum, m) => sum + (m.rating || 0), 0) / mems.length) * 10) / 10
        : null;
    const avgRev =
      revs.length > 0
        ? Math.round(
            (revs.reduce((sum, r) => sum + (r.mastery_level || 0), 0) / revs.length) * 10
          ) / 10
        : null;
    const avgExam =
      exs.filter((e) => e.total_score != null).length > 0
        ? Math.round(
            exs
              .filter((e) => e.total_score != null)
              .reduce((sum, e) => sum + e.total_score, 0) /
              exs.filter((e) => e.total_score != null).length
          )
        : null;

    const currentMonthSub = subs.find((s) => s.month === month) || null;

    return {
      ...student,
      attendance: { present, absent, total: totalAtt, percentage: attendancePct },
      memorization: {
        sessions: mems.length,
        avgRating: avgMem,
        latest: mems[0] || null,
        recent: mems.slice(0, 5),
      },
      revision: {
        sessions: revs.length,
        avgMastery: avgRev,
        latest: revs[0] || null,
        recent: revs.slice(0, 5),
      },
      exams: {
        total: exs.length,
        avgScore: avgExam,
        latest: exs[0] || null,
        recent: exs.slice(0, 5),
      },
      subscription: {
        currentMonth: month,
        paidThisMonth: !!currentMonthSub,
        latest: currentMonthSub || subs[0] || null,
        history: subs.slice(0, 6),
      },
    };
  });

  return { data: summaries, error: null };
}
