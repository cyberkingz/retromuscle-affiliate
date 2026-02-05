interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

export function SectionHeading({ eyebrow, title, subtitle }: SectionHeadingProps) {
  return (
    <header className="space-y-2">
      {eyebrow ? (
        <p className="inline-flex rounded-full border border-line bg-white/70 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-foreground/65">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-4xl uppercase leading-[0.92] sm:text-5xl">{title}</h2>
      {subtitle ? <p className="max-w-3xl text-sm text-foreground/75 sm:text-base">{subtitle}</p> : null}
    </header>
  );
}
