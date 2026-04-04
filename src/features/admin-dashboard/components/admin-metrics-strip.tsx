import { Metric } from "@/components/ui/metric";
import { formatCurrency } from "@/lib/currency";

interface AdminMetricsStripProps {
  creatorsActive: number;
  validationTodo: number;
  paymentsTodo: number;
  totalToPay: number;
}

export function AdminMetricsStrip({
  creatorsActive,
  validationTodo,
  paymentsTodo,
  totalToPay
}: AdminMetricsStripProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Créateurs actifs" value={String(creatorsActive)} />
      <Metric label="Vidéos à valider" value={String(validationTodo)} urgent={validationTodo > 0} />
      <Metric label="Paiements à faire" value={String(paymentsTodo)} urgent={paymentsTodo > 0} />
      <Metric label="Total à payer" value={formatCurrency(totalToPay)} />
    </section>
  );
}
