import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getRequired(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function isSupabaseAnonConfigured(): boolean {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    return false;
  }

  // Avoid misconfig where a publishable key is mistakenly used as anon JWT.
  if (anonKey.startsWith("sb_publishable_") || anonKey.startsWith("sb_secret_")) {
    return false;
  }

  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function assertLegacyAnonJwtKey(value: string) {
  // Supabase "publishable" keys are not JWTs. For email+password auth flows, the legacy anon JWT key
  // is significantly more reliable (notably for `/auth/v1/token` exchanges).
  if (value.startsWith("sb_publishable_") || value.startsWith("sb_secret_")) {
    throw new Error(
      "Invalid NEXT_PUBLIC_SUPABASE_ANON_KEY: expected the legacy anon JWT (starts with 'eyJ...'), " +
        "not a 'sb_publishable_*' or 'sb_secret_*' key."
    );
  }
}

export function createSupabaseAnonServerClient(): SupabaseClient {
  const url = getRequired("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getRequired("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  assertLegacyAnonJwtKey(anonKey);

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}
