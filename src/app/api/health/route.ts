import { NextResponse } from "next/server";

import { createSupabaseServerClient, isSupabaseConfigured } from "@/infrastructure/supabase/server-client";

export async function GET() {
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
    } catch {
      checks.supabaseReachable = false;
    }
  }

  const ok = checks.supabaseConfigured ? checks.supabaseReachable === true : true;
  return NextResponse.json(
    {
      ok,
      checks
    },
    { status: ok ? 200 : 503 }
  );
}

