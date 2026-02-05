import { Card } from "@/components/ui/card";

interface MetricProps {
  label: string;
  value: string;
}

export function Metric({ label, value }: MetricProps) {
  return (
    <Card className="space-y-1 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-foreground/55">{label}</p>
      <p className="font-display text-4xl uppercase leading-none text-secondary">{value}</p>
    </Card>
  );
}
