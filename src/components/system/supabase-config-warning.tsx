"use client";

import { useMemo } from "react";

import { Card } from "@/components/ui/card";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function getSupabaseConfigIssue(): string | null {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    return "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local.";
  }
  if (!key) {
    return "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Add the legacy anon JWT key (starts with 'eyJ...') to .env.local.";
  }

  if (key.startsWith("sb_secret_")) {
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY is set to a secret key. Do not expose secret keys client-side.";
  }

  // We purposely require the legacy anon JWT for reliable password auth.
  if (key.startsWith("sb_publishable_")) {
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY looks like a publishable key. Use the legacy anon JWT key (starts with 'eyJ...') for password auth.";
  }

  if (key.startsWith("eyJ")) {
    const payload = decodeJwtPayload(key);
    const role = typeof payload?.role === "string" ? payload.role : null;
    if (role && role !== "anon") {
      return `NEXT_PUBLIC_SUPABASE_ANON_KEY JWT role is '${role}'. It should be 'anon'.`;
    }
  }

  return null;
}

export function SupabaseConfigWarning() {
  const issue = useMemo(() => getSupabaseConfigIssue(), []);

  if (!issue) return null;

  return (
    <Card className="border-secondary/25 bg-frost/70 p-4 text-sm text-foreground/75">
      <p className="font-medium text-secondary/80">Supabase config issue (dev)</p>
      <p className="mt-1">{issue}</p>
    </Card>
  );
}

