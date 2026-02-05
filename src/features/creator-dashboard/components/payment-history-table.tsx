import { DataTableCard } from "@/components/ui/data-table-card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { monthToLabel, toShortDate } from "@/lib/date";
import { paymentStatusTone } from "@/lib/status-tone";

interface PaymentHistoryTableProps {
  history: Array<{
    month: string;
    deliveredTotal: number;
    quotaTotal: number;
    paymentStatus: string;
    amount: number;
    paidAt?: string;
  }>;
}

export function PaymentHistoryTable({ history }: PaymentHistoryTableProps) {
  return (
    <DataTableCard title="Historique & paiements" subtitle="Suivi des validations et paiements precedents.">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Mois</TableHead>
            <TableHead>Livrees</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Paiement</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.month}>
              <TableCell className="font-semibold capitalize">{monthToLabel(item.month)}</TableCell>
              <TableCell>
                {item.deliveredTotal}/{item.quotaTotal}
              </TableCell>
              <TableCell>
                <StatusBadge label={item.paymentStatus} tone={paymentStatusTone(item.paymentStatus)} />
              </TableCell>
              <TableCell className="font-medium">{formatCurrency(item.amount)}</TableCell>
              <TableCell>{item.paidAt ? toShortDate(item.paidAt) : "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableCard>
  );
}
