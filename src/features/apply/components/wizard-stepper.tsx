import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/cn";

interface WizardStepperProps {
  step: number;
  stepPercent: number;
  steps: Array<{ title: string; description: string }>;
  onSelect(step: number): void;
}

export function WizardStepper({ step, stepPercent, steps, onSelect }: WizardStepperProps) {
  return (
    <div className="space-y-3">
      <ProgressBar
        percent={stepPercent}
        label={`Étape ${step + 1}/${steps.length}`}
        className="px-1"
      />
      <div
        className="grid gap-1 rounded-2xl border border-line bg-frost/50 p-1"
        style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
      >
        {steps.map((item, index) => {
          const active = index === step;
          const done = index < step;
          return (
            <button
              key={item.title}
              type="button"
              onClick={() => onSelect(index)}
              aria-current={active ? "step" : undefined}
              className={cn(
                "rounded-xl px-3 py-2.5 text-left transition-all",
                active
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "text-foreground/60 hover:bg-white/70"
              )}
            >
              <p className="text-[10px] uppercase tracking-[0.1em] opacity-70">
                {done ? "✓ " : ""}Étape {index + 1}
              </p>
              <p className="mt-0.5 text-sm font-semibold leading-tight">{item.title}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
