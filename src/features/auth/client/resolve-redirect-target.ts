import type { AuthRole, RedirectTarget } from "@/features/auth/types";

interface ResolveAuthRoutingResult {
  role: AuthRole | null;
  target: RedirectTarget;
}

function normalizeTarget(value: unknown): RedirectTarget {
  if (value === "/admin" || value === "/dashboard" || value === "/contract" || value === "/onboarding") {
    return value;
  }

  return "/onboarding";
}

function normalizeRole(value: unknown): AuthRole | null {
  if (value === "admin" || value === "affiliate") {
    return value;
  }

  return null;
}

export async function resolveAuthRouting(): Promise<ResolveAuthRoutingResult> {
  const response = await fetch("/api/auth/redirect-target", {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    return { role: null, target: "/onboarding" };
  }

  const data = (await response.json()) as { role?: unknown; target?: unknown };
  return {
    role: normalizeRole(data.role),
    target: normalizeTarget(data.target)
  };
}

export async function resolveRedirectTarget(): Promise<RedirectTarget> {
  const routing = await resolveAuthRouting();
  return routing.target;
}
