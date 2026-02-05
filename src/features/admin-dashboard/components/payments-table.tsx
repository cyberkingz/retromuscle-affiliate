import { DataTableCard } from "@/components/ui/data-table-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/currency";
import { paymentStatusTone } from "@/lib/status-tone";

interface PaymentsTableProps {
  rows: Array<{
    creatorHandle: string;
    deliveredSummary: string;
    amount: number;
    paymentStatus: string;
  }>;
}

export function PaymentsTable({ rows }: PaymentsTableProps) {
  return (
    <DataTableCard title="Gestion paiements" subtitle="Montants et statuts du cycle en cours.">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Createur</TableHead>
            <TableHead>Livrees</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.creatorHandle}>
              <TableCell className="font-semibold">{row.creatorHandle}</TableCell>
              <TableCell>{row.deliveredSummary}</TableCell>
              <TableCell className="font-medium">{formatCurrency(row.amount)}</TableCell>
              <TableCell>
                <StatusBadge label={row.paymentStatus} tone={paymentStatusTone(row.paymentStatus)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableCard>
  );
}
