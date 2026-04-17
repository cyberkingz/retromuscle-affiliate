"use client";

import { useState } from "react";
import { Tag, Copy, Check, ShoppingBag, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export const CREATOR_STORE_URL =
  "https://retromuscle.net?utm_source=creator-dashboard&utm_medium=kit&utm_campaign=creator-kit";

interface PromoCodeCardProps {
  /** Promo code once minted. Null/undefined when pending or failed. */
  promoCode?: string | null;
  /** Status of the creator's kit promo code. Drives which UI variant is shown. */
  kitStatus: "pending_code" | "code_ready" | "ordered" | "failed";
}

export function PromoCodeCard({ promoCode, kitStatus }: PromoCodeCardProps) {
  if (kitStatus === "pending_code") {
    return <PromoCodePendingCard />;
  }
  if (kitStatus === "failed") {
    return <PromoCodeFailedCard />;
  }
  if (!promoCode) {
    // Defensive: ordered/code_ready shouldn't reach this, but render a graceful fallback.
    return <PromoCodeFailedCard />;
  }
  return <PromoCodeReadyCard promoCode={promoCode} ordered={kitStatus === "ordered"} />;
}

// ---------------------------------------------------------------------------
// Ready / Ordered: active code surface with copy button
// ---------------------------------------------------------------------------
function PromoCodeReadyCard({ promoCode, ordered }: { promoCode: string; ordered: boolean }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(promoCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[20px] border border-primary/20 px-[18px] py-4",
        "bg-white/85 [background-image:radial-gradient(ellipse_at_top_right,rgba(255,82,177,0.07)_0%,transparent_60%)]"
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-[15px] -right-[5px] select-none font-display text-[80px] font-black leading-none text-primary/[0.06]"
      >
        #
      </span>

      <div className="mb-2 flex items-center gap-1.5">
        <Tag className="h-3 w-3 text-primary" />
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary">
          {ordered ? "Kit commandé" : "Code exclusif"}
        </span>
      </div>

      <p
        className="font-display text-[36px] font-black uppercase leading-none tracking-[0.04em] text-primary break-all"
        aria-label={`Code promo : ${promoCode}`}
      >
        {promoCode}
      </p>

      <p className="mb-3 mt-1 text-[11px] leading-[1.5] text-foreground/50">
        {ordered
          ? "Ton kit est en route. Le code a déjà été utilisé — on t'envoie la confirmation par email."
          : "-20% sur toute la boutique. Commande ta première tenue RetroMuscle pour shooter. Valable\u00a01\u00a0fois."}
      </p>

      <button
        type="button"
        onClick={handleCopy}
        disabled={ordered}
        className={cn(
          "inline-flex w-full items-center justify-center gap-1.5 rounded-[18px] px-4 py-[9px]",
          "text-[11px] font-bold uppercase tracking-[0.08em] text-white transition active:scale-95",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
          copied ? "bg-emerald-500" : "bg-secondary hover:bg-secondary/90"
        )}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Copié&nbsp;!
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            {ordered ? "Code déjà utilisé" : "Copier le code"}
          </>
        )}
      </button>

      {!ordered && (
        <a
          href={CREATOR_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-foreground/40 transition hover:text-foreground/65"
        >
          <ShoppingBag className="h-3 w-3" />
          Aller sur la boutique
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pending: contract freshly signed, code is about to arrive
// ---------------------------------------------------------------------------
function PromoCodePendingCard() {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-line bg-white/85 px-[18px] py-4">
      <div className="mb-2 flex items-center gap-1.5">
        <Loader2 className="h-3 w-3 animate-spin text-foreground/50" />
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-foreground/60">
          Code en préparation
        </span>
      </div>

      <p className="font-display text-[18px] font-black uppercase leading-tight tracking-[0.02em] text-foreground/80">
        On t'envoie ton code dans quelques secondes
      </p>

      <p className="mt-2 text-[11px] leading-[1.5] text-foreground/50">
        Ton contrat vient d'être signé. Le code personnel arrive sous peu par email et s'affichera
        ici automatiquement. Rafraîchis la page si rien après 2 minutes.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Failed: code generation failed — creator sees a contact-us message
// ---------------------------------------------------------------------------
function PromoCodeFailedCard() {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-amber-400/40 bg-amber-50 px-[18px] py-4">
      <div className="mb-2 flex items-center gap-1.5">
        <AlertTriangle className="h-3 w-3 text-amber-600" />
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-700">
          Code en attente
        </span>
      </div>

      <p className="font-display text-[18px] font-black uppercase leading-tight tracking-[0.02em] text-amber-900">
        On prépare ton code manuellement
      </p>

      <p className="mt-2 text-[11px] leading-[1.5] text-amber-900/70">
        Petit grain de sable technique. L'équipe RetroMuscle va te l'envoyer par email dans les
        prochaines heures. Pas besoin de faire quoi que ce soit.
      </p>
    </div>
  );
}
