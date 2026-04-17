import { Gift, Link2 } from "lucide-react";

import type { CreatorKitStatus } from "@/domain/types";

import { KitStatusBanner } from "./kit-status-banner";
import { PromoCodeCard } from "./promo-code-card";

interface CreatorKitSectionProps {
  contractSignedAt?: string;
  kitStatus: CreatorKitStatus;
  promoCode?: string | null;
}

export function CreatorKitSection({
  contractSignedAt,
  kitStatus,
  promoCode
}: CreatorKitSectionProps) {
  // Only render once contract is signed
  if (!contractSignedAt) return null;

  return (
    <section aria-labelledby="creator-kit-heading" className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Gift className="h-3.5 w-3.5 text-foreground/50" />
        <h2
          id="creator-kit-heading"
          className="text-xs font-bold uppercase tracking-[0.14em] text-foreground/60"
        >
          Mon Kit Créateur
        </h2>
      </div>

      {/* Promo code card — variant depends on kitStatus */}
      <PromoCodeCard
        promoCode={promoCode}
        kitStatus={
          kitStatus === "not_applicable"
            ? "pending_code" // defensive: if contract is signed we shouldn't be here
            : kitStatus
        }
      />

      {/* "Kit en route" mint banner — shown the moment the webhook marks the order */}
      {kitStatus === "ordered" && <KitStatusBanner />}

      {/* Affiliation — coming soon placeholder */}
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-frost/40 px-4 py-3.5 opacity-60">
        <Link2 className="h-4 w-4 shrink-0 text-foreground/40" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground/60">
            Lien d&apos;affiliation
          </p>
          <p className="text-[11px] text-foreground/40">
            Bientôt disponible — gagne une commission sur chaque vente générée par ton audience.
          </p>
        </div>
        <span className="ml-auto shrink-0 rounded-full border border-line bg-white/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground/40">
          Bientôt
        </span>
      </div>
    </section>
  );
}
