import { Metric } from "@/components/ui/metric";

interface GoalsStripProps {
  items: Array<{ label: string; metric: string }>;
}

export function GoalsStrip({ items }: GoalsStripProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Metric key={item.label} label={item.label} value={item.metric} />
      ))}
    </section>
  );
}
