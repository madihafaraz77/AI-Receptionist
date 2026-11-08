import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";

export type AuditActorType = "doctor" | "staff" | "system";

export type AuditEvent = {
  action: string;
  actorId: string | null;
  actorType: AuditActorType;
  tableName?: string;
  recordId?: string | null;
  before?: unknown;
  after?: unknown;
};

/**
 * Appends a row to `audit_logs`.
 *
 * The database only exposes `log_audit_event` to the service role, so this
 * helper uses the server-only secret client. Audit failures are logged and do
 * not roll back the user's change; the settings update is still protected by
 * RLS and checked server-side.
 */
export async function writeAuditEvent(event: AuditEvent): Promise<void> {
  if (!getSupabaseConfig()?.secretKey) {
    console.warn(
      `[audit] ${event.action} was not recorded because SUPABASE_SECRET_KEY is not configured.`,
    );
    return;
  }

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.rpc("log_audit_event", {
      p_action: event.action,
      p_actor_id: event.actorId,
      p_actor_type: event.actorType,
      p_table_name: event.tableName ?? null,
      p_record_id: event.recordId ?? null,
      p_before: event.before ?? null,
      p_after: event.after ?? null,
    });

    if (error) {
      console.error("[audit] could not record event", {
        action: event.action,
        code: error.code,
        message: error.message,
      });
    }
  } catch (error) {
    console.error("[audit] unexpected failure", { action: event.action, error });
  }
}
