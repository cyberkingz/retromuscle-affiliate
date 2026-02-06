import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getRequired(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function resolveServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(resolveServiceRoleKey());
}

export function createSupabaseServerClient(): SupabaseClient {
  const url = getRequired("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = resolveServiceRoleKey();

  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
