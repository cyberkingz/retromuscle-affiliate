"use client";

import { useState } from "react";
import { Tag, Copy, Check, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/cn";

export const CREATOR_PROMO_CODE = "CREATOR20";
export const CREATOR_STORE_URL =
  "https://retromuscle.net?utm_source=creator-dashboard&utm_medium=kit&utm_campaign=creator-kit";

export function PromoCodeCard() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(CREATOR_PROMO_CODE).then(() => {
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
      {/* Decorative # (magenta tint) */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-[15px] -right-[5px] select-none font-display text-[80px] font-black leading-none text-primary/[0.06]"
      >
        #
      </span>

      {/* Badge — magenta */}
      <div className="mb-2 flex items-center gap-1.5">
        <Tag className="h-3 w-3 text-primary" />
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary">
          Code exclusif
        </span>
      </div>

      {/* Code — magenta, tight tracking */}
      <p
        className="font-display text-[36px] font-black uppercase leading-none tracking-[0.04em] text-primary"
        aria-label={`Code promo : ${CREATOR_PROMO_CODE}`}
      >
        {CREATOR_PROMO_CODE}
      </p>

      {/* Description */}
      <p className="mb-3 mt-1 text-[11px] leading-[1.5] text-foreground/50">
        Commande ta première tenue RetroMuscle pour shooter. Valable&nbsp;1&nbsp;fois.
      </p>

      {/* Full-width copy button — navy */}
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "inline-flex w-full items-center justify-center gap-1.5 rounded-[18px] px-4 py-[9px]",
          "text-[11px] font-bold uppercase tracking-[0.08em] text-white transition active:scale-95",
          copied
            ? "bg-emerald-500"
            : "bg-secondary hover:bg-secondary/90"
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
            Copier le code
          </>
        )}
      </button>

      {/* Centered store link below button */}
      <a
        href={CREATOR_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-foreground/40 transition hover:text-foreground/65"
      >
        <ShoppingBag className="h-3 w-3" />
        Aller sur la boutique
      </a>
    </div>
  );
}
