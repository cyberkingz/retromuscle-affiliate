"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getPublicSupabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }
  return value;
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (client) {
    return client;
  }

  const url = getPublicSupabaseUrl();
  // Supabase "publishable" keys are not JWTs. For email+password auth flows, the legacy anon JWT key
  // is significantly more reliable (notably for `/auth/v1/token` exchanges).
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Set the legacy anon JWT key (the long eyJhbGciOi... value) for reliable password auth."
    );
  }
  if (anonKey.startsWith("sb_publishable_") || anonKey.startsWith("sb_secret_")) {
    throw new Error(
      "Invalid NEXT_PUBLIC_SUPABASE_ANON_KEY: expected the legacy anon JWT (starts with 'eyJ...'), " +
        "not a 'sb_publishable_*' or 'sb_secret_*' key."
    );
  }

  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return client;
}
