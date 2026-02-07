"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { AuthRole, RedirectTarget } from "@/features/auth/types";

interface AuthUser {
  id: string;
  email: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: AuthRole | null;
  redirectTarget: RedirectTarget | null;
  resolvingRole: boolean;
  loading: boolean;
  error: string | null;
  refreshSession(): Promise<void>;
  refreshRouting(): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeTarget(value: unknown): RedirectTarget | null {
  if (value === "/admin" || value === "/dashboard" || value === "/contract" || value === "/onboarding") {
    return value;
  }
  return null;
}

function normalizeRole(value: unknown): AuthRole | null {
  if (value === "admin" || value === "affiliate") {
    return value;
  }
  return null;
}

function normalizeUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const input = value as Record<string, unknown>;
  const id = typeof input.id === "string" ? input.id.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : null;
  if (!id) {
    return null;
  }
  return { id, email };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [redirectTarget, setRedirectTarget] = useState<RedirectTarget | null>(null);
  const [resolvingRole, setResolvingRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const expireSession = useCallback(async () => {
    try {
      await fetch("/api/auth/sign-out", { method: "POST", cache: "no-store" });
    } catch {
      // ignore
    } finally {
      setUser(null);
      setRole(null);
      setRedirectTarget(null);
      setError(null);
    }

    // Avoid redirect loops if the user is already on /login.
    if (pathname !== "/login") {
      router.replace("/login?reason=expired");
    }
  }, [router, pathname]);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (response.status === 401 || response.status === 403) {
        await expireSession();
        return;
      }
      if (!response.ok) {
        setUser(null);
        setRole(null);
        setRedirectTarget(null);
        setError("Impossible de charger la session.");
        return;
      }

      const data = (await response.json()) as { user?: unknown; role?: unknown; target?: unknown };
      setUser(normalizeUser(data.user));
      setRole(normalizeRole(data.role));
      setRedirectTarget(normalizeTarget(data.target));
      setError(null);
    } catch (caught) {
      setUser(null);
      setRole(null);
      setRedirectTarget(null);
      setError(caught instanceof Error ? caught.message : "Impossible de charger la session.");
    }
  }, [expireSession]);

  const refreshRouting = useCallback(async () => {
    setResolvingRole(true);
    try {
      const response = await fetch("/api/auth/redirect-target", { cache: "no-store" });
      if (response.status === 401 || response.status === 403) {
        await expireSession();
        return;
      }
      if (!response.ok) {
        setRole(null);
        setRedirectTarget(null);
        return;
      }

      const data = (await response.json()) as { role?: unknown; target?: unknown };
      setRole(normalizeRole(data.role));
      setRedirectTarget(normalizeTarget(data.target));
    } finally {
      setResolvingRole(false);
    }
  }, [expireSession]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/sign-out", { method: "POST", cache: "no-store" });
    } finally {
      setUser(null);
      setRole(null);
      setRedirectTarget(null);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    refreshSession()
      .catch(() => {
        // error state already handled by refreshSession
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      redirectTarget,
      resolvingRole,
      loading,
      error,
      refreshSession,
      refreshRouting,
      signOut
    }),
    [user, role, redirectTarget, resolvingRole, loading, error, refreshSession, refreshRouting, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
