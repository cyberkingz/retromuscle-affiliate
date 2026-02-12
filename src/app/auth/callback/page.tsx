"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { resolveRedirectTarget } from "@/features/auth/client/resolve-redirect-target";
import { getSupabaseBrowserClient } from "@/infrastructure/supabase/browser-client";

function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Verification en cours...");

  useEffect(() => {
    let supabase: ReturnType<typeof getSupabaseBrowserClient> | null = null;
    try {
      supabase = getSupabaseBrowserClient();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Service d'authentification indisponible.");
      return;
    }
    if (!supabase) {
      return;
    }
    const client = supabase;
    const code = searchParams.get("code");
    const next = searchParams.get("next");
    const safeNext =
      next === "/onboarding" || next === "/login" || next === "/dashboard" || next === "/admin" || next === "/contract"
        ? next
        : "/login";

    async function run() {
      try {
        if (code) {
          setMessage("Verification de ton email...");
          const { data: exchanged, error } = await client.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }

          setMessage("Creation de ta session...");
          const accessToken =
            exchanged.session?.access_token ??
            (await client.auth.getSession()).data.session?.access_token;

          if (accessToken) {
            setMessage("Redirection...");
            const target = await resolveRedirectTarget();
            router.replace(target);
            return;
          }

          router.replace(safeNext);
          return;
        }
        setMessage("Lien invalide. Retourne sur la page d'inscription pour recommencer.");
      } catch (error) {
        const raw = error instanceof Error ? error.message : "";
        if (raw.toLowerCase().includes("expired")) {
          setMessage("Ce lien a expire. Demande un nouvel email de verification.");
        } else {
          setMessage("Erreur de connexion. Reessaie ou contacte le support.");
        }
      }
    }

    run();
  }, [router, searchParams]);

  return (
    <Card className="max-w-lg bg-white p-6">
      <p className="text-sm animate-pulse text-foreground/70">{message}</p>
    </Card>
  );
}

export default function AuthCallbackPage() {
  return (
    <PageShell>
      <Suspense
        fallback={
          <Card className="max-w-lg bg-white p-6">
            <p className="text-sm animate-pulse text-foreground/70">Verification en cours...</p>
          </Card>
        }
      >
        <AuthCallbackClient />
      </Suspense>
    </PageShell>
  );
}
