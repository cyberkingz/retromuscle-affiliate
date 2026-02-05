import { DataTableCard } from "@/components/ui/data-table-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";

interface PayoutBreakdownTableProps {
  items: Array<{
    key: string;
    label: string;
    delivered: number;
    rate: number;
    subtotal: number;
  }>;
}

export function PayoutBreakdownTable({ items }: PayoutBreakdownTableProps) {
  return (
    <DataTableCard title="Remuneration estimee par type" subtitle="Simulation mensuelle par format de video.">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Type</TableHead>
            <TableHead>Livre</TableHead>
            <TableHead>Tarif</TableHead>
            <TableHead>Sous-total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.key}>
              <TableCell className="font-semibold">{item.label}</TableCell>
              <TableCell>{item.delivered}</TableCell>
              <TableCell>{formatCurrency(item.rate)}</TableCell>
              <TableCell className="font-semibold text-secondary">{formatCurrency(item.subtotal)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableCard>
  );
}
