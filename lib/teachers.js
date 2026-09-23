import { supabase } from "./supabase";
import { logActivity } from "./activityLog";

export async function getTeachers({ search = "", status = "all" } = {}) {
  let query = supabase
    .from("teachers")
    .select("*, halaqat(id, name, is_active)")
    .order("created_at", { ascending: false });

  if (status === "active") {
    query = query.eq("is_active", true);
  } else if (status === "inactive") {
    query = query.eq("is_active", false);
  }

  if (search && search.trim()) {
    const s = search.trim();
    query = query.or(`name.ilike.%${s}%,phone.ilike.%${s}%`);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function getTeacherById(id) {
  const { data, error } = await supabase
    .from("teachers")
    .select("*, halaqat(id, name, is_active, section, type)")
    .eq("id", id)
    .single();

  return { data, error };
}

export async function createTeacher({
  name,
  phone,
  email,
  specialization,
  notes,
  is_active = true,
}) {
  const payload = {
    name: name.trim(),
    phone: phone?.trim() || null,
    email: email?.trim() || null,
    specialization: specialization?.trim() || null,
    notes: notes?.trim() || null,
    is_active: is_active ?? true,
  };

  const { data, error } = await supabase
    .from("teachers")
    .insert(payload)
    .select()
    .single();

  if (!error && data) {
    logActivity("teacher_created", `تم إضافة محفظ جديد: ${data.name}`);
  }

  return { data, error };
}

export async function updateTeacher(id, fields) {
  const payload = {};
  if (fields.name !== undefined) payload.name = fields.name.trim();
  if (fields.phone !== undefined) payload.phone = fields.phone?.trim() || null;
  if (fields.email !== undefined) payload.email = fields.email?.trim() || null;
  if (fields.specialization !== undefined)
    payload.specialization = fields.specialization?.trim() || null;
  if (fields.notes !== undefined) payload.notes = fields.notes?.trim() || null;
  if (fields.is_active !== undefined) payload.is_active = fields.is_active;

  const { data, error } = await supabase
    .from("teachers")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (!error && data) {
    logActivity("teacher_updated", `تم تعديل بيانات المحفظ: ${data.name}`);
  }

  return { data, error };
}

export async function setTeacherActive(id, name, isActive) {
  const { data, error } = await supabase
    .from("teachers")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();

  if (!error && data) {
    logActivity(
      "teacher_updated",
      isActive ? `تم إعادة تفعيل المحفظ: ${name}` : `تم إيقاف المحفظ: ${name}`
    );
  }

  return { data, error };
}

export async function deleteTeacher(id) {
  // Check if teacher has associated halaqat first
  const { data: halaqat, error: checkError } = await supabase
    .from("halaqat")
    .select("id")
    .eq("teacher_id", id);

  if (checkError) {
    return { error: checkError };
  }

  if (halaqat && halaqat.length > 0) {
    return {
      error: new Error("لا يمكن حذف المحفظ لأنه مرتبط بحلقات قائمة. يفضل إيقاف تفعيله بدلاً من الحذف."),
    };
  }

  const { data, error } = await supabase
    .from("teachers")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (!error && data) {
    logActivity("teacher_deleted", `تم حذف المحفظ: ${data.name}`);
  }

  return { data, error };
}
