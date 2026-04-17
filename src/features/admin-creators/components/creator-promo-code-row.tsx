"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, RefreshCw } from "lucide-react";

import type { CreatorKitStatus } from "@/domain/types";
import { Button } from "@/components/ui/button";
import { KitStatusCell } from "@/features/admin-dashboard/components/kit-status-cell";
import { cn } from "@/lib/cn";
import { toShortDate } from "@/lib/date";

interface CreatorPromoCodeRowProps {
  creatorId: string;
  promoCode?: string | null;
  kitOrderPlacedAt?: string | null;
  kitStatus: CreatorKitStatus;
}

/**
 * Admin-side panel showing a creator's Shopify kit promo code, its derived
 * status, and a regenerate action. Appears in the creator detail page.
 */
export function CreatorPromoCodeRow({
  creatorId,
  promoCode,
  kitOrderPlacedAt,
  kitStatus
}: CreatorPromoCodeRowProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCopy() {
    if (!promoCode) return;
    void navigator.clipboard.writeText(promoCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleRegenerate() {
    if (regenerating) return;
    const confirmed = window.confirm(
      promoCode
        ? `Régénérer le code pour ce créateur ? L'ancien code (${promoCode}) sera désactivé côté Shopify.`
        : "Générer un code Shopify pour ce créateur ?"
    );
    if (!confirmed) return;

    setRegenerating(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/creators/${creatorId}/regenerate-kit-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Erreur régénération");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur régénération");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/70">Kit Shopify</p>
          <KitStatusCell status={kitStatus} />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={regenerating}
          onClick={() => void handleRegenerate()}
        >
          <RefreshCw
            className={cn("mr-2 h-4 w-4", regenerating && "animate-spin")}
            aria-hidden
          />
          {regenerating ? "Régénération…" : promoCode ? "Régénérer" : "Générer"}
        </Button>
      </div>

      {promoCode ? (
        <div className="flex flex-wrap items-center gap-3">
          <code className="rounded-lg border border-line bg-white px-3 py-1.5 font-mono text-sm font-semibold tracking-wider text-primary">
            {promoCode}
          </code>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            aria-label={copied ? "Code copié" : "Copier le code"}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-emerald-500" />
                Copié
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copier
              </>
            )}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-foreground/65">
          {kitStatus === "pending_code"
            ? "Génération en cours côté Shopify."
            : kitStatus === "not_applicable"
              ? "Le créateur n'a pas encore signé le contrat."
              : "Aucun code n'a été généré. Cliquer sur Régénérer pour réessayer."}
        </p>
      )}

      {kitOrderPlacedAt ? (
        <p className="text-xs text-foreground/60">
          Kit commandé le {toShortDate(kitOrderPlacedAt)}.
        </p>
      ) : null}

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
