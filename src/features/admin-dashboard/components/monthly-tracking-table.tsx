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
import { toShortDate } from "@/lib/date";
import { paymentStatusTone } from "@/lib/status-tone";

interface MonthlyTrackingTableProps {
  rows: Array<{
    creatorId: string;
    handle: string;
    packageTier: number;
    mixLabel: string;
    quotas: Record<string, number>;
    delivered: Record<string, number>;
    deliveredTotal: number;
    remainingTotal: number;
    deadline: string;
    paymentStatus: string;
    payoutAmount: number;
  }>;
}

export function MonthlyTrackingTable({ rows }: MonthlyTrackingTableProps) {
  return (
    <DataTableCard title="Suivi mensuel detaille" subtitle="Vue synthese par createur pour le mois actif.">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Createur</TableHead>
            <TableHead>Pkg</TableHead>
            <TableHead>Mix</TableHead>
            <TableHead>Livre</TableHead>
            <TableHead>Reste</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Paiement</TableHead>
            <TableHead>Montant</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.creatorId}>
              <TableCell className="font-semibold">{row.handle}</TableCell>
              <TableCell>Pack {row.packageTier}</TableCell>
              <TableCell>{row.mixLabel}</TableCell>
              <TableCell>{row.deliveredTotal}</TableCell>
              <TableCell className={row.remainingTotal > 0 ? "text-primary font-semibold" : "text-mint font-semibold"}>
                {row.remainingTotal}
              </TableCell>
              <TableCell>{toShortDate(row.deadline)}</TableCell>
              <TableCell>
                <StatusBadge label={row.paymentStatus} tone={paymentStatusTone(row.paymentStatus)} />
              </TableCell>
              <TableCell className="font-medium">{formatCurrency(row.payoutAmount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableCard>
  );
}
