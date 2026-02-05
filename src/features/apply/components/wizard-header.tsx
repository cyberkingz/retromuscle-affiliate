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
    <header className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-[24px] px-4 py-4 sm:px-5">
      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Compte connecte</p>
        <p className="text-sm text-foreground/75">{email}</p>
      </div>
      <div className="flex items-center gap-2">
        {statusLabel ? <StatusBadge label={statusLabel} tone={statusTone} /> : null}
        <Button
          type="button"
          onClick={onSignOut}
          variant="outline"
          size="pill"
        >
          Deconnexion
        </Button>
      </div>
    </header>
  );
}
