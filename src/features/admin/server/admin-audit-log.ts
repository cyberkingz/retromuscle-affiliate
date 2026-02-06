import "server-only";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";

function firstIp(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const candidate = value.split(",")[0]?.trim();
  return candidate ? candidate : null;
}

export async function writeAdminAuditLog(input: {
  request: Request;
  requestId?: string;
  adminUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const client = createSupabaseServerClient();

  const ip = firstIp(input.request.headers.get("x-forwarded-for")) ?? input.request.headers.get("x-real-ip");
  const userAgent = input.request.headers.get("user-agent");

  const row = {
    admin_user_id: input.adminUserId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
    request_id: input.requestId ?? null,
    ip: ip ?? null,
    user_agent: userAgent ?? null
  };

  // Best-effort logging: do not break the user flow if audit insert fails.
  await client.from("admin_audit_log").insert(row);
}

