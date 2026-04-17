import { PackageCheck } from "lucide-react";

/**
 * Mint confirmation banner rendered when the Shopify `orders/create` webhook
 * has marked the creator's kit as ordered. Pairs with the "Kit commandé"
 * state of the PromoCodeCard.
 */
export function KitStatusBanner() {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl border border-mint/40 bg-mint/10 px-4 py-3"
    >
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mint/20">
        <PackageCheck className="h-4 w-4 text-mint" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-mint">
          Kit en route
        </p>
        <p className="mt-0.5 text-[12px] leading-[1.5] text-secondary/80">
          Ta tenue RetroMuscle arrive. Dès qu'elle est entre tes mains, lance ta première vidéo —
          on a hâte de voir ça.
        </p>
      </div>
    </div>
  );
}
