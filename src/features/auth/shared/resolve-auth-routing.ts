import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { AuthRole, RedirectTarget } from "@/features/auth/types";

function normalizeRole(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function resolveAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export async function resolveAuthRoutingForUser(input: {
  supabase: SupabaseClient;
  user: User;
}): Promise<{ role: AuthRole; target: RedirectTarget }> {
  const email = input.user.email?.toLowerCase();
  const metadataRole = normalizeRole(input.user.app_metadata?.role ?? input.user.user_metadata?.role);
  const isAdmin = metadataRole === "admin" || (email ? resolveAdminEmails().includes(email) : false);

  if (isAdmin) {
    return { role: "admin", target: "/admin" };
  }

  const { data: application, error: applicationError } = await input.supabase
    .from("creator_applications")
    .select("status")
    .eq("user_id", input.user.id)
    .maybeSingle();

  if (applicationError) {
    throw new Error("Unable to resolve application status");
  }

  if (application?.status === "approved") {
    const { data: creator, error: creatorError } = await input.supabase
      .from("creators")
      .select("id, contract_signed_at")
      .eq("user_id", input.user.id)
      .maybeSingle();

    if (creatorError) {
      throw new Error("Unable to resolve creator profile");
    }

    if (creator?.id) {
      return { role: "affiliate", target: creator.contract_signed_at ? "/dashboard" : "/contract" };
    }
  }

  return { role: "affiliate", target: "/onboarding" };
}

