import { supabase } from "./supabase";
import { logActivity } from "./activityLog";

export const DEFAULT_SETTINGS = {
  center_name: "مركز تحفيظ القرآن",
  manager_name: "",
  phone: "",
  email: "",
  address: "",
  default_subscription_amount: 100,
  currency: "EGP",
};

/**
 * Retrieves the current center settings.
 * If no record exists, safely initializes the singleton record.
 */
export async function getSettings() {
  try {
    const { data, error } = await supabase
      .from("center_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching center settings:", error);
      return { data: null, error };
    }

    if (!data) {
      // If table is empty for any reason, initialize it safely
      return await initializeSettings();
    }

    return { data, error: null };
  } catch (err) {
    console.error("Unexpected error in getSettings:", err);
    return { data: null, error: err };
  }
}

/**
 * Initializes the default settings record safely if not already present.
 */
export async function initializeSettings() {
  try {
    const { data, error } = await supabase
      .from("center_settings")
      .upsert(
        {
          center_name: DEFAULT_SETTINGS.center_name,
          manager_name: null,
          phone: null,
          email: null,
          address: null,
          default_subscription_amount: DEFAULT_SETTINGS.default_subscription_amount,
          currency: DEFAULT_SETTINGS.currency,
          is_singleton: true,
        },
        { onConflict: "is_singleton" }
      )
      .select()
      .single();

    return { data, error };
  } catch (err) {
    console.error("Unexpected error in initializeSettings:", err);
    return { data: null, error: err };
  }
}

/**
 * Updates the existing center settings record.
 * Validates fields and updates updated_at timestamp.
 */
export async function updateSettings(fields) {
  try {
    // Basic validation
    if (fields.center_name !== undefined && !fields.center_name?.trim()) {
      return {
        data: null,
        error: new Error("اسم المركز مطلوب ولا يمكن تركه فارغاً"),
      };
    }

    if (fields.default_subscription_amount !== undefined) {
      const amountNum = Number(fields.default_subscription_amount);
      if (isNaN(amountNum) || amountNum < 0) {
        return {
          data: null,
          error: new Error("قيمة الاشتراك الافتراضية يجب أن تكون رقماً غير سالب (0 أو أكثر)"),
        };
      }
    }

    const payload = {
      updated_at: new Date().toISOString(),
    };

    if (fields.center_name !== undefined) {
      payload.center_name = fields.center_name.trim();
    }
    if (fields.manager_name !== undefined) {
      payload.manager_name = fields.manager_name?.trim() || null;
    }
    if (fields.phone !== undefined) {
      payload.phone = fields.phone?.trim() || null;
    }
    if (fields.email !== undefined) {
      payload.email = fields.email?.trim() || null;
    }
    if (fields.address !== undefined) {
      payload.address = fields.address?.trim() || null;
    }
    if (fields.default_subscription_amount !== undefined) {
      payload.default_subscription_amount = Number(fields.default_subscription_amount);
    }
    if (fields.currency !== undefined) {
      payload.currency = fields.currency?.trim() || "EGP";
    }

    // Ensure we update the existing record
    const targetId = fields.id;
    let query = supabase.from("center_settings").update(payload);

    if (targetId) {
      query = query.eq("id", targetId);
    } else {
      query = query.eq("is_singleton", true);
    }

    const { data, error } = await query.select().single();

    if (!error && data) {
      logActivity("settings_updated", "تم تحديث إعدادات المركز");
    }

    return { data, error };
  } catch (err) {
    console.error("Unexpected error in updateSettings:", err);
    return { data: null, error: err };
  }
}
