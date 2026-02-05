import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

interface CreatorHeaderProps {
  handle: string;
  displayName: string;
  country: string;
  status: string;
  monthLabel: string;
  packageTier: number;
  mixLabel: string;
  monthlyCreditsLabel: string;
}

export function CreatorHeader({
  handle,
  displayName,
  country,
  status,
  monthLabel,
  packageTier,
  mixLabel,
  monthlyCreditsLabel
}: CreatorHeaderProps) {
  return (
    <Card className="grid gap-4 bg-gradient-to-br from-white to-frost/80 p-7 sm:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.15em] text-foreground/50">Dashboard createur</p>
        <h1 className="font-display text-5xl uppercase leading-none">{handle}</h1>
        <p className="text-sm text-foreground/70">
          {displayName} - {country}
        </p>
        <StatusBadge label={status} tone={status === "actif" ? "success" : "neutral"} />
      </div>
      <div className="space-y-3 rounded-xl bg-white/80 p-4">
        <p className="text-xs uppercase tracking-[0.15em] text-foreground/50">{monthLabel}</p>
        <p className="text-sm text-foreground/70">Package: {packageTier} videos / mois</p>
        <p className="text-sm text-foreground/70">Mix: {mixLabel}</p>
        <p className="text-sm text-foreground/70">Credits mensuels: {monthlyCreditsLabel}</p>
      </div>
    </Card>
  );
}
