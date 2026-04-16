import type { FlowData } from "@/application/use-cases/get-saas-landing-data";

interface FlowSectionProps {
  flow: FlowData;
}

export function FlowSection({ flow }: FlowSectionProps) {
  return (
    <section className="animate-fade-up">
      <div className="text-center">
        <h2 className="font-display text-4xl uppercase tracking-tight text-secondary sm:text-5xl">
          {flow.title}
        </h2>
        <p className="mt-2 text-foreground/70">{flow.subtitle}</p>
      </div>

      <div className="relative mt-10 grid gap-0 md:grid-cols-3">
        {/* Single connector line behind all circles (desktop only) */}
        <div className="absolute left-[16.67%] right-[16.67%] top-[calc(2rem+1.75rem)] hidden h-px bg-foreground/15 md:block" />

        {flow.steps.map((step, index) => (
          <div
            key={step.step}
            className="relative flex flex-col items-center text-center px-6 py-8"
          >
            <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-foreground bg-primary text-xl font-bold text-foreground">
              {step.step}
            </div>

            <h3 className="mt-4 font-display text-2xl uppercase leading-none text-secondary sm:text-3xl">
              {step.title}
            </h3>

            <p className="mt-2 max-w-[240px] text-sm leading-relaxed text-foreground/70">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
