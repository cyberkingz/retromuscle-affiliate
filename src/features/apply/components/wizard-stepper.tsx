import { ProgressBar } from "@/components/ui/progress-bar";
import { SelectableCardButton } from "@/components/ui/selectable-card-button";
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
      <ProgressBar percent={stepPercent} label={`Etape ${step + 1}/${steps.length}`} className="px-1" />
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] md:grid md:grid-cols-3 md:overflow-visible">
        {steps.map((item, index) => {
          const active = index === step;

          return (
            <SelectableCardButton
              key={item.title}
              onClick={() => onSelect(index)}
              selected={active}
              className={cn(
                `shrink-0 snap-start px-4 py-3 md:shrink ${active ? "" : "glass-panel"}`,
                "min-w-[220px] md:min-w-0"
              )}
            >
              <p
                className={`text-[11px] uppercase tracking-[0.12em] ${
                  active ? "text-secondary-foreground/75" : "text-foreground/50"
                }`}
              >
                Etape {index + 1}
              </p>
              <p className="mt-1 text-sm font-semibold">{item.title}</p>
              <p
                className={`mt-1 hidden text-xs sm:block ${
                  active ? "text-secondary-foreground/75" : "text-foreground/65"
                }`}
              >
                {item.description}
              </p>
            </SelectableCardButton>
          );
        })}
      </div>
    </div>
  );
}
