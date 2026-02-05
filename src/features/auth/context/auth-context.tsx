"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

import type { AuthRole, RedirectTarget } from "@/features/auth/client/resolve-redirect-target";
import { resolveAuthRouting } from "@/features/auth/client/resolve-redirect-target";
import { getSupabaseBrowserClient } from "@/infrastructure/supabase/browser-client";

interface AuthContextValue {
  client: SupabaseClient | null;
  session: Session | null;
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

function syncAccessTokenCookie(session: Session | null) {
  if (typeof document === "undefined") {
    return;
  }

  if (!session?.access_token) {
    document.cookie = "rm_access_token=; path=/; max-age=0; samesite=lax";
    return;
  }

  const secure = window.location.protocol === "https:" ? "; secure" : "";
  const maxAge = Math.max(
    60,
    Math.floor((new Date(session.expires_at ? session.expires_at * 1000 : Date.now() + 3600_000).getTime() - Date.now()) / 1000)
  );
  document.cookie = `rm_access_token=${session.access_token}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [redirectTarget, setRedirectTarget] = useState<RedirectTarget | null>(null);
  const [resolvingRole, setResolvingRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    if (!client) {
      return;
    }

    const { data, error: sessionError } = await client.auth.getSession();
    if (sessionError) {
      setError(sessionError.message);
      return;
    }

    const nextSession = data.session ?? null;
    setSession(nextSession);
    syncAccessTokenCookie(nextSession);
  }, [client]);

  const refreshRouting = useCallback(async () => {
    if (!session?.access_token) {
      setRole(null);
      setRedirectTarget(null);
      return;
    }

    setResolvingRole(true);
    try {
      const routing = await resolveAuthRouting(session.access_token);
      setRole(routing.role);
      setRedirectTarget(routing.target);
    } catch {
      setRole(null);
      setRedirectTarget("/onboarding");
    } finally {
      setResolvingRole(false);
    }
  }, [session?.access_token]);

  const signOut = useCallback(async () => {
    if (!client) {
      return;
    }

    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      return;
    }
    setRole(null);
    setRedirectTarget(null);
  }, [client]);

  useEffect(() => {
    let supabaseClient: SupabaseClient | null = null;
    try {
      supabaseClient = getSupabaseBrowserClient();
      setClient(supabaseClient);
      setError(null);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Supabase is not configured");
      setLoading(false);
      return;
    }

    supabaseClient.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (sessionError) {
          setError(sessionError.message);
          return;
        }
        const nextSession = data.session ?? null;
        setSession(nextSession);
        syncAccessTokenCookie(nextSession);
      })
      .finally(() => {
        setLoading(false);
      });

    const {
      data: { subscription }
    } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      syncAccessTokenCookie(nextSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      setRole(null);
      setRedirectTarget(null);
      setResolvingRole(false);
      return;
    }

    let ignore = false;
    setResolvingRole(true);

    resolveAuthRouting(session.access_token)
      .then((routing) => {
        if (ignore) {
          return;
        }

        setRole(routing.role);
        setRedirectTarget(routing.target);
      })
      .catch(() => {
        if (ignore) {
          return;
        }

        setRole(null);
        setRedirectTarget("/onboarding");
      })
      .finally(() => {
        if (!ignore) {
          setResolvingRole(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [session?.access_token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      client,
      session,
      role,
      redirectTarget,
      resolvingRole,
      loading,
      error,
      refreshSession,
      refreshRouting,
      signOut
    }),
    [client, session, role, redirectTarget, resolvingRole, loading, error, refreshSession, refreshRouting, signOut]
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
