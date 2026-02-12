import { cn } from "@/lib/cn";

interface ProgressBarProps {
  percent: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ percent, label, className }: ProgressBarProps) {
  const clampedPercent = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <p className="text-xs uppercase tracking-[0.12em] text-foreground/60">{label}</p> : null}
      <div
        className="h-2.5 w-full overflow-hidden rounded-full border border-line bg-foreground/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clampedPercent}
        aria-label={label ?? "Progression"}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-secondary transition-all"
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
}
