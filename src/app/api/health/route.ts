import { createSupabaseServerClient, isSupabaseConfigured } from "@/infrastructure/supabase/server-client";
import { apiJson, createApiContext } from "@/lib/api-response";

const REQUIRED_BUCKETS = ["videos", "rushes"] as const;

export async function GET(request: Request) {
  const ctx = createApiContext(request);
  const now = new Date().toISOString();
  const checks: Record<string, unknown> = {
    timestamp: now,
    supabaseConfigured: isSupabaseConfigured()
  };

  if (isSupabaseConfigured()) {
    try {
      const client = createSupabaseServerClient();
      const { error } = await client.from("package_definitions").select("tier").limit(1);
      checks.supabaseReachable = !error;

      const { data: buckets, error: bucketsError } = await client.storage.listBuckets();
      if (bucketsError) {
        checks.storageReachable = false;
      } else {
        checks.storageReachable = true;
        const names = (buckets ?? []).map((b) => b.name);
        checks.buckets = names;
        checks.requiredBucketsPresent = REQUIRED_BUCKETS.every((name) => names.includes(name));
      }
    } catch {
      checks.supabaseReachable = false;
      checks.storageReachable = false;
    }
  }

  const ok = checks.supabaseConfigured
    ? checks.supabaseReachable === true &&
      checks.storageReachable === true &&
      (checks.requiredBucketsPresent === undefined || checks.requiredBucketsPresent === true)
    : true;
  const status = ok ? 200 : 503;
  return apiJson(ctx, { ok, checks }, { status });
}
