import { supabase } from "./supabase";
import { logActivity } from "./activityLog";

export async function createHalaqa({ name, teacher_name, teacher_id, type, section }) {
  const payload = {
    name,
    type,
    section,
    teacher_id: teacher_id || null,
  };
  if (teacher_name !== undefined) {
    payload.teacher_name = teacher_name || null;
  }

  const { data, error } = await supabase
    .from("halaqat")
    .insert(payload)
    .select()
    .single();

  if (!error) {
    logActivity("halaqa_created", `تم إنشاء حلقة جديدة: ${name}`);
  }
  return { data, error };
}

export async function updateHalaqa(id, fields) {
  const { data, error } = await supabase
    .from("halaqat")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (!error) {
    logActivity("halaqa_updated", `تم تعديل بيانات الحلقة: ${data.name}`);
  }
  return { data, error };
}

export async function setHalaqaActive(id, name, isActive) {
  const { data, error } = await supabase
    .from("halaqat")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();

  if (!error) {
    logActivity(
      "halaqa_updated",
      isActive ? `تم إعادة تفعيل حلقة: ${name}` : `تم إيقاف حلقة: ${name}`
    );
  }
  return { data, error };
}
