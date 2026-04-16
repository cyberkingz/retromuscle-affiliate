import type { SupabaseClient, User } from "@supabase/supabase-js";

import { AFFILIATE_CONTRACT_VERSION } from "@/domain/contracts/affiliate-program-contract";
import type { AuthRole, RedirectTarget } from "@/features/auth/types";

function normalizeRole(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function resolveAuthRoutingForUser(input: {
  supabase: SupabaseClient;
  user: User;
}): Promise<{ role: AuthRole; target: RedirectTarget }> {
  // SECURITY: Only trust app_metadata.role (set by admin/service-role).
  // Never fall back to user_metadata.role — users can self-set it.
  const metadataRole = normalizeRole(input.user.app_metadata?.role);
  const isAdmin = metadataRole === "admin";

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
      if (!creator.contract_signed_at) {
        return { role: "affiliate", target: "/contract" };
      }

      // Verify the creator has signed the current contract version.
      const { data: sig } = await input.supabase
        .from("creator_contract_signatures")
        .select("id")
        .eq("creator_id", creator.id)
        .eq("contract_version", AFFILIATE_CONTRACT_VERSION)
        .maybeSingle();

      return { role: "affiliate", target: sig ? "/dashboard" : "/contract" };
    }

    // Application approved but creator not yet provisioned (admin lag).
    return { role: "affiliate", target: "/onboarding/approved" };
  }

  return { role: "affiliate", target: "/onboarding" };
}
