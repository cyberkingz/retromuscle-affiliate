"use client";

import { useEffect, useState } from "react";
import { Copy, Check, ShoppingBag, Gift } from "lucide-react";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { CREATOR_PROMO_CODE, CREATOR_STORE_URL } from "./promo-code-card";

interface WelcomePromoModalProps {
  contractSignedAt?: string;
  creatorId: string;
}

export function WelcomePromoModal({ contractSignedAt, creatorId }: WelcomePromoModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!contractSignedAt) return;
    const key = `rm_promo_seen_${creatorId}`;
    if (!localStorage.getItem(key)) setOpen(true);
  }, [contractSignedAt, creatorId]);

  function dismiss() {
    localStorage.setItem(`rm_promo_seen_${creatorId}`, "1");
    setOpen(false);
  }

  function handleCopy() {
    void navigator.clipboard.writeText(CREATOR_PROMO_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <>
      {/* Keyframe animations — scoped, injected once */}
      <style>{`
        @keyframes rm-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes rm-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-5px) rotate(-3deg); }
          66%       { transform: translateY(-3px) rotate(2deg); }
        }
        @keyframes rm-spark {
          0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          50%       { opacity: 1; transform: scale(1.1) rotate(15deg); }
        }
        @keyframes rm-ticket-in {
          0%   { opacity: 0; transform: translateY(8px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .rm-code-shimmer {
          background: linear-gradient(
            100deg,
            hsl(55,98%,64%) 0%,
            hsl(55,98%,92%) 35%,
            hsl(55,98%,64%) 55%,
            hsl(55,98%,64%) 100%
          );
          background-size: 250% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: rm-shimmer 2.8s linear infinite;
        }
        .rm-float  { animation: rm-float 3.2s ease-in-out infinite; }
        .rm-spark  { animation: rm-spark 2.4s ease-in-out infinite; }
        .rm-spark:nth-child(2) { animation-delay: 0.8s; }
        .rm-spark:nth-child(3) { animation-delay: 1.6s; }
        .rm-ticket-in { animation: rm-ticket-in 0.35s ease-out both; animation-delay: 0.12s; }
      `}</style>

      <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
        <DialogContent
          className={cn(
            "max-w-[380px] overflow-hidden border-none p-0 gap-0",
            /* Full navy background — retro grid overlay */
            "bg-secondary"
          )}
          style={{
            backgroundImage:
              "linear-gradient(hsl(227 78% 12% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(227 78% 12% / 0.4) 1px, transparent 1px)",
            backgroundSize: "22px 22px"
          }}
        >
          {/* ── Decorative sparkles ── */}
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden
          >
            <span className="rm-spark absolute left-[12%] top-[10%] text-accent text-lg">✦</span>
            <span className="rm-spark absolute right-[18%] top-[8%] text-accent text-sm">✦</span>
            <span className="rm-spark absolute left-[28%] top-[22%] text-primary text-xs">✦</span>
            {/* Large retro '#' watermark */}
            <span className="pointer-events-none absolute -bottom-6 -right-4 select-none font-display text-[160px] font-black leading-none text-white/[0.03]">
              #
            </span>
          </div>

          {/* ── Header section ── */}
          <div className="relative px-7 pb-6 pt-8 text-white">
            {/* Radial glow */}
            <div className="pointer-events-none absolute -top-10 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary opacity-20 blur-3xl" />

            {/* Floating gift icon */}
            <div className="rm-float relative mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-[0_0_24px_rgba(212,0,106,0.35)]">
                <Gift className="h-7 w-7 text-primary" />
              </div>
            </div>

            <DialogTitle className="sr-only">Kit créateur débloqué</DialogTitle>
            <div className="space-y-1 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                Programme créateur
              </p>
              <div className="mx-auto my-1.5 h-px w-10 bg-white/15" />
              <p className="font-display text-[34px] font-black uppercase leading-none text-white">
                Kit créateur<br />
                <span className="text-accent">débloqué&nbsp;!</span>
              </p>
            </div>
          </div>

          {/* ── Ticket / code section ── */}
          <div className="rm-ticket-in relative mx-5 mb-5">
            {/* Perforated-ticket edge: circles punched out on left/right */}
            <div
              className="relative rounded-2xl bg-white/[0.07] px-5 py-5"
              style={{
                border: "1.5px dashed rgba(255,255,255,0.15)",
                backdropFilter: "blur(4px)"
              }}
            >
              {/* Circle cutout hints at top corners */}
              <div className="pointer-events-none absolute -left-[13px] top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-secondary" style={{ backgroundImage: "linear-gradient(hsl(227 78% 12% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(227 78% 12% / 0.4) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
              <div className="pointer-events-none absolute -right-[13px] top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-secondary" style={{ backgroundImage: "linear-gradient(hsl(227 78% 12% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(227 78% 12% / 0.4) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />

              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/35">
                  Code exclusif · -20%
                </p>
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                  Actif
                </span>
              </div>

              <DialogDescription className="sr-only">
                Utilise le code {CREATOR_PROMO_CODE} pour -20% sur ta première commande RetroMuscle.
              </DialogDescription>

              <p
                className="rm-code-shimmer font-display text-[56px] font-black uppercase leading-none tracking-[0.04em]"
                aria-label={`Code promo : ${CREATOR_PROMO_CODE}`}
              >
                {CREATOR_PROMO_CODE}
              </p>

              <p className="mt-2.5 text-[11px] text-white/30">
                Valable 1&nbsp;fois · non cumulable · première commande uniquement
              </p>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="px-5 pb-6 space-y-3">
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "inline-flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-full",
                "text-xs font-bold uppercase tracking-[0.1em] transition-all duration-200 active:scale-[0.97]",
                copied
                  ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                  : "bg-primary text-white shadow-[0_0_20px_rgba(212,0,106,0.35)] hover:bg-primary/90 hover:shadow-[0_0_28px_rgba(212,0,106,0.5)]"
              )}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Code copié&nbsp;!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copier le code
                </>
              )}
            </button>

            <div className="flex items-center justify-between">
              <a
                href={CREATOR_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismiss}
                className="inline-flex items-center gap-1.5 text-[11px] text-white/35 transition hover:text-white/65"
              >
                <ShoppingBag className="h-3 w-3" />
                Aller sur la boutique
              </a>
              <button
                type="button"
                onClick={dismiss}
                className="text-[11px] text-white/35 transition hover:text-white/65"
              >
                Fermer
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
