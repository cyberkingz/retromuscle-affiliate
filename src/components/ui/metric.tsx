import { cn } from "@/lib/cn";

interface MetricProps {
  label: string;
  value: string;
  urgent?: boolean;
}

export function Metric({ label, value, urgent }: MetricProps) {
  return (
    <div
      className={cn("rounded-2xl bg-white/95 p-5 shadow-sm", urgent && "border-l-4 border-primary")}
    >
      <p className="text-[11px] uppercase tracking-[0.14em] text-foreground/65">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-3xl uppercase leading-none",
          urgent ? "text-primary" : "text-secondary"
        )}
      >
        {value}
      </p>
    </div>
  );
}
