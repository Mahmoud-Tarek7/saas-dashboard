import { supabase } from "./supabase";
import { logActivity } from "./activityLog";

export async function createStudent({ name, parent_phone, halaqa_id }) {
  const { data, error } = await supabase
    .from("students")
    .insert({ name, parent_phone, halaqa_id })
    .select()
    .single();

  if (!error) {
    logActivity("student_created", `تم تسجيل طالب جديد: ${name}`);
  }
  return { data, error };
}

export async function updateStudent(id, fields) {
  const { data, error } = await supabase
    .from("students")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (!error) {
    logActivity("student_updated", `تم تعديل بيانات الطالب: ${data.name}`);
  }
  return { data, error };
}

export async function setStudentActive(id, name, isActive) {
  const { data, error } = await supabase
    .from("students")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();

  if (!error) {
    logActivity(
      "student_updated",
      isActive ? `تم إعادة تفعيل الطالب: ${name}` : `تم إيقاف الطالب: ${name}`
    );
  }
  return { data, error };
}

export async function transferStudent(id, name, newHalaqaId) {
  const { data, error } = await supabase
    .from("students")
    .update({ halaqa_id: newHalaqaId })
    .eq("id", id)
    .select()
    .single();

  if (!error) {
    logActivity("student_updated", `تم نقل الطالب ${name} لحلقة جديدة`);
  }
  return { data, error };
}
