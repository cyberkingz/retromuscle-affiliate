"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { resolveRedirectTarget } from "@/features/auth/client/resolve-redirect-target";
import type { RedirectTarget } from "@/features/auth/types";

/**
 * Centralised hook that redirects the authenticated user to the correct
 * destination (resolved via `/api/auth/redirect-target`).
 *
 * @param hasSession  `true` when an active user session exists.
 * @param loading     `true` while the session is still being resolved.
 * @param stayOn      Optional pathname where the user is *allowed* to stay
 *                    (e.g. "/onboarding"). When `resolveRedirectTarget`
 *                    returns this path, the hook does **not** navigate.
 * @param fallback    Fallback path when the redirect target cannot be resolved.
 *
 * @returns `{ redirecting }` — `true` while navigation is in progress.
 */
export function useAuthRedirect(options: {
  hasSession: boolean;
  loading: boolean;
  stayOn?: RedirectTarget;
  fallback?: RedirectTarget | "/login";
}): { redirecting: boolean } {
  const { hasSession, loading, stayOn, fallback = "/onboarding" } = options;
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (loading || !hasSession) {
      return;
    }

    setRedirecting(true);
    let cancelled = false;

    resolveRedirectTarget()
      .then((target) => {
        if (cancelled) return;
        if (stayOn && target === stayOn) {
          setRedirecting(false);
          return;
        }
        router.replace(target);
      })
      .catch(() => {
        if (!cancelled) {
          router.replace(fallback);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loading, hasSession, stayOn, fallback, router]);

  return { redirecting };
}
