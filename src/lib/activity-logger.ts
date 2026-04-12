import { supabase } from "@/integrations/supabase/client";

export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  entityTitle,
  details,
}: {
  userId: string;
  action: "created" | "updated" | "deleted" | "viewed" | "exported";
  entityType: "case" | "document" | "client" | "contract" | "invoice" | "draft" | "hearing" | "search";
  entityId?: string;
  entityTitle?: string;
  details?: Record<string, unknown>;
}) {
  try {
    await supabase.from("activity_log").insert([{
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      entity_title: entityTitle || null,
      details: (details || {}) as any,
    }]);
  } catch {
    // Silently fail — audit logging should never block user actions
  }
}
