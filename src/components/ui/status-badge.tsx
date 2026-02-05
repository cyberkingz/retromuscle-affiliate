import { cn } from "@/lib/cn";

interface StatusBadgeProps {
  label: string;
  tone?: "neutral" | "success" | "warning";
}

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em]",
        tone === "success" && "border-mint/40 bg-mint/10 text-mint",
        tone === "warning" && "border-primary/40 bg-primary/10 text-foreground",
        tone === "neutral" && "border-line bg-frost text-foreground/70"
      )}
    >
      {label}
    </span>
  );
}
