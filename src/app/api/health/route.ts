import {
  createSupabaseServerClient,
  isSupabaseConfigured
} from "@/infrastructure/supabase/server-client";
import { apiJson, createApiContext } from "@/lib/api-response";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";

export async function GET(request: Request) {
  const ctx = createApiContext(request);

  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  const now = new Date().toISOString();
  const checks: Record<string, unknown> = {
    timestamp: now,
    supabaseConfigured: isSupabaseConfigured()
  };

  if (isSupabaseConfigured()) {
    try {
      const client = createSupabaseServerClient();
      const { error } = await client.from("video_rates").select("video_type").limit(1);
      checks.supabaseReachable = !error;
    } catch {
      checks.supabaseReachable = false;
    }
  }

  const ok = checks.supabaseConfigured ? checks.supabaseReachable === true : true;
  const status = ok ? 200 : 503;
  const response = apiJson(ctx, { ok, checks }, { status });
  if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
  return response;
}
