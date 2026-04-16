import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

interface WizardHeaderProps {
  email?: string;
  statusLabel?: string;
  statusTone?: "neutral" | "success" | "warning";
  onSignOut(): void;
}

export function WizardHeader({ email, statusLabel, statusTone = "neutral", onSignOut }: WizardHeaderProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-frost/50 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.1em] text-foreground/50">Compte connecté</p>
        <p className="truncate text-sm text-foreground/70">{email}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {statusLabel ? <StatusBadge label={statusLabel} tone={statusTone} /> : null}
        <Button type="button" onClick={onSignOut} variant="outline" size="sm" className="text-xs">
          Déconnexion
        </Button>
      </div>
    </div>
  );
}
