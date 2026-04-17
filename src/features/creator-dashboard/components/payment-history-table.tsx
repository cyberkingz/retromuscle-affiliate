import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/currency";
import { monthToLabel, toShortDate } from "@/lib/date";
import { paymentStatusTone } from "@/lib/status-tone";

interface PaymentHistoryTableProps {
  history: Array<{
    month: string;
    deliveredTotal: number;
    paymentStatus: string;
    amount: number;
    paidAt?: string;
  }>;
}

export function PaymentHistoryTable({ history }: PaymentHistoryTableProps) {
  if (history.length === 0) {
    return (
      <p className="py-2 text-[12px] text-foreground/40">Aucun historique de paiement.</p>
    );
  }

  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr>
          <th className="pb-2 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-foreground/40">
            Mois
          </th>
          <th className="pb-2 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-foreground/40">
            Vidéos
          </th>
          <th className="pb-2 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-foreground/40">
            Statut
          </th>
          <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-[0.12em] text-foreground/40">
            Montant
          </th>
          <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-[0.12em] text-foreground/40">
            Payé le
          </th>
        </tr>
      </thead>
      <tbody>
        {history.map((item) => (
          <tr
            key={item.month}
            style={{ borderTop: "1px solid hsl(227 78% 12% / 0.07)" }}
          >
            <td className="py-2 font-semibold capitalize text-foreground/75">
              {monthToLabel(item.month)}
            </td>
            <td className="py-2 text-center text-foreground/60">{item.deliveredTotal}</td>
            <td className="py-2">
              <StatusBadge
                label={item.paymentStatus}
                tone={paymentStatusTone(item.paymentStatus)}
              />
            </td>
            <td className="py-2 text-right font-bold text-secondary">
              {formatCurrency(item.amount)}
            </td>
            <td className="py-2 text-right text-foreground/50">
              {item.paidAt ? toShortDate(item.paidAt) : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
