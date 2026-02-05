import { Card } from "@/components/ui/card";

interface RushesSummaryCardProps {
  totalFiles: number;
  totalSizeLabel: string;
}

export function RushesSummaryCard({ totalFiles, totalSizeLabel }: RushesSummaryCardProps) {
  return (
    <Card className="space-y-2 bg-white p-5 sm:p-6">
      <p className="text-xs uppercase tracking-[0.15em] text-foreground/50">Zone rushes</p>
      <p className="font-display text-4xl uppercase leading-none">{totalFiles} fichiers</p>
      <p className="text-sm text-foreground/70">Volume total: {totalSizeLabel}</p>
      <p className="text-xs text-foreground/55">Bonus potentiel si des rushes exploitables sont fournis.</p>
    </Card>
  );
}
