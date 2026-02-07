import "server-only";

import { createSupabaseAnonServerClient, isSupabaseAnonConfigured } from "@/infrastructure/supabase/anon-server-client";

export async function refreshSupabaseSession(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null | undefined;
} | null> {
  if (!isSupabaseAnonConfigured()) {
    return null;
  }

  const supabase = createSupabaseAnonServerClient();
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session?.access_token || !data.session.refresh_token) {
    return null;
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at ?? null
  };
}

