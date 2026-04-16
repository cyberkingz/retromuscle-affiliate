"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

const AUTO_REFRESH_INTERVAL_MS = 30_000;

export function ApprovedWaitingScreen() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL_MS / 1000);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.refresh();
          return AUTO_REFRESH_INTERVAL_MS / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  function handleManualRefresh() {
    setChecking(true);
    router.refresh();
    setTimeout(() => setChecking(false), 2000);
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <div className="flex justify-center gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 animate-bounce rounded-full bg-secondary"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <h1 className="font-display text-3xl uppercase leading-tight tracking-wide">
            Candidature approuvée&nbsp;!
          </h1>
        </div>

        <div className="space-y-3 rounded-2xl border border-line bg-frost/70 p-5 text-sm text-foreground/75">
          <p>
            Ton accès créateur est en cours de configuration. Cette étape prend généralement moins
            de 5 minutes.
          </p>
          <p>
            Tu recevras un e-mail dès que ton espace est prêt. La page se rafraîchit automatiquement
            toutes les 30 secondes.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            onClick={handleManualRefresh}
            disabled={checking}
            className="w-full"
          >
            {checking ? "Vérification..." : `Vérifier maintenant (auto dans ${countdown}s)`}
          </Button>

          <p className="text-xs text-foreground/60">
            Si tu attends depuis plus de 24&nbsp;h, contacte-nous à{" "}
            <a
              href="mailto:contact@retromuscle.com"
              className="underline underline-offset-2 hover:text-foreground/80"
            >
              contact@retromuscle.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
