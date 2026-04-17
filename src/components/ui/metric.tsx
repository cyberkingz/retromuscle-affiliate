import { cn } from "@/lib/cn";

interface MetricProps {
  label: string;
  value: string;
  urgent?: boolean;
}

export function Metric({ label, value, urgent }: MetricProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[20px] p-5",
        urgent
          ? "bg-secondary text-white"
          : "border border-line bg-white/90"
      )}
    >
      {/* Decorative watermark for urgent */}
      {urgent && (
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-3 -right-1 select-none font-display text-[72px] font-black leading-none text-white/[0.05]"
        >
          !
        </span>
      )}
      <p
        className={cn(
          "text-[10px] font-bold uppercase tracking-[0.14em]",
          urgent ? "text-white/50" : "text-foreground/55"
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-display text-[34px] font-black uppercase leading-none",
          urgent ? "text-accent" : "text-secondary"
        )}
      >
        {value}
      </p>
    </div>
  );
}
