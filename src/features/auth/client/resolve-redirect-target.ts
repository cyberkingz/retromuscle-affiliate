export type RedirectTarget = "/admin" | "/dashboard" | "/contract" | "/onboarding";
export type AuthRole = "admin" | "affiliate";

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

export async function resolveAuthRouting(accessToken: string): Promise<ResolveAuthRoutingResult> {
  const response = await fetch("/api/auth/redirect-target", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
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

export async function resolveRedirectTarget(accessToken: string): Promise<RedirectTarget> {
  const routing = await resolveAuthRouting(accessToken);
  return routing.target;
}
