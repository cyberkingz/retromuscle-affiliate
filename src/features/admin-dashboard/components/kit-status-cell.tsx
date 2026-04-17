import {
  AlertTriangle,
  Clock,
  MinusCircle,
  PackageCheck,
  Tag
} from "lucide-react";

import type { CreatorKitStatus } from "@/domain/types";
import { cn } from "@/lib/cn";

const STATUS_CONFIG: Record<
  CreatorKitStatus,
  {
    label: string;
    icon: typeof Tag;
    classes: string;
  }
> = {
  not_applicable: {
    label: "Non applicable",
    icon: MinusCircle,
    classes: "border-line bg-frost/60 text-foreground/55"
  },
  pending_code: {
    label: "Code en cours",
    icon: Clock,
    classes: "border-amber-400/40 bg-amber-50 text-amber-800"
  },
  code_ready: {
    label: "Code prêt",
    icon: Tag,
    classes: "border-primary/35 bg-primary/10 text-primary"
  },
  ordered: {
    label: "Kit commandé",
    icon: PackageCheck,
    classes: "border-mint/40 bg-mint/10 text-mint"
  },
  failed: {
    label: "Échec — retry",
    icon: AlertTriangle,
    classes: "border-destructive/40 bg-destructive/10 text-destructive"
  }
};

interface KitStatusCellProps {
  status: CreatorKitStatus;
}

/**
 * Retro pill for a creator's kit status. 5 states:
 * - `not_applicable` — contract unsigned, no kit expected
 * - `pending_code` — contract signed, Shopify call in flight
 * - `code_ready` — promo code minted, creator hasn't ordered yet
 * - `ordered` — `orders/create` webhook received
 * - `failed` — code generation failed; admin needs to retry
 */
export function KitStatusCell({ status }: KitStatusCellProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1",
        "text-[10px] font-bold uppercase tracking-[0.1em]",
        config.classes
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {config.label}
    </span>
  );
}
