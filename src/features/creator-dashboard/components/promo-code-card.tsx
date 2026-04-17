"use client";

import { useState } from "react";
import { Tag, Copy, Check, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/cn";

export const CREATOR_PROMO_CODE = "CREATOR20";
const STORE_URL =
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
        "relative overflow-hidden rounded-2xl border border-secondary/35",
        "bg-gradient-to-br from-secondary/20 via-secondary/8 to-transparent",
        "shadow-[0_0_24px_rgba(212,0,106,0.10)] p-5"
      )}
    >
      {/* Decorative # — retro creator aesthetic */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-6 -right-3 select-none font-display text-[110px] font-black leading-none text-secondary/6"
      >
        #
      </span>

      {/* Label tag */}
      <div className="mb-3 flex items-center gap-1.5">
        <Tag className="h-3 w-3 text-secondary" />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-secondary/80">
          Code exclusif
        </span>
      </div>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Code + description */}
        <div className="space-y-1.5">
          <p
            className="font-display text-4xl font-black uppercase leading-none tracking-wider text-secondary sm:text-5xl"
            aria-label={`Code promo : ${CREATOR_PROMO_CODE}`}
          >
            {CREATOR_PROMO_CODE}
          </p>
          <p className="text-xs leading-relaxed text-foreground/55">
            Commande ta première tenue RetroMuscle pour shooter.
            <br className="hidden sm:block" />
            Valable&nbsp;1&nbsp;fois par compte client.
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full px-6",
              "text-xs font-bold uppercase tracking-[0.08em] text-white transition active:scale-95 sm:w-auto",
              copied
                ? "bg-emerald-500 border border-emerald-500/50"
                : "bg-secondary border border-secondary/50 hover:bg-secondary/90"
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

          <a
            href={STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[36px] items-center justify-center gap-1.5 text-xs text-foreground/45 transition hover:text-foreground/75 sm:justify-end"
          >
            <ShoppingBag className="h-3 w-3" />
            Aller sur la boutique
          </a>
        </div>
      </div>
    </div>
  );
}
