import { ProgressBar } from "@/components/ui/progress-bar";
import { SelectableCardButton } from "@/components/ui/selectable-card-button";

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
      <div className="grid gap-2 md:grid-cols-3">
        {steps.map((item, index) => {
          const active = index === step;

          return (
            <SelectableCardButton
              key={item.title}
              onClick={() => onSelect(index)}
              selected={active}
              className={`px-4 py-3 ${active ? "" : "glass-panel"}`}
            >
              <p
                className={`text-[11px] uppercase tracking-[0.12em] ${
                  active ? "text-secondary-foreground/75" : "text-foreground/50"
                }`}
              >
                Etape {index + 1}
              </p>
              <p className="mt-1 text-sm font-semibold">{item.title}</p>
              <p className={`mt-1 text-xs ${active ? "text-secondary-foreground/75" : "text-foreground/65"}`}>
                {item.description}
              </p>
            </SelectableCardButton>
          );
        })}
      </div>
    </div>
  );
}
