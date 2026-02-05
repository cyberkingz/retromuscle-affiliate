import { Metric } from "@/components/ui/metric";
import { formatCurrency } from "@/lib/currency";

interface AdminMetricsStripProps {
  creatorsComplete: number;
  creatorsPending: number;
  paymentsTodo: number;
  totalToPay: number;
}

export function AdminMetricsStrip({
  creatorsComplete,
  creatorsPending,
  paymentsTodo,
  totalToPay
}: AdminMetricsStripProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Createurs OK" value={String(creatorsComplete)} />
      <Metric label="Createurs en attente" value={String(creatorsPending)} />
      <Metric label="Paiements a faire" value={String(paymentsTodo)} />
      <Metric label="Total a payer" value={formatCurrency(totalToPay)} />
    </section>
  );
}
