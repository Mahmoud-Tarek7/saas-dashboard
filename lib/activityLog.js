import { supabase } from "./supabase";

// دالة موحدة لتسجيل النشاط - أبسط شكل ممكن يتوسع لاحقًا
export async function logActivity(type, description) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // النشاط ليس حرجًا لعمل المستخدم، فلو فشل التسجيل لا نكسر العملية الأساسية
  try {
    await supabase.from("activity_log").insert({
      type,
      description,
      actor_id: user?.id,
    });
  } catch (e) {
    console.error("activity log failed", e);
  }
}
