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

interface RatesTableProps {
  rates: Array<{
    videoType: string;
    ratePerVideo: number;
    isPlaceholder: boolean;
  }>;
}

export function RatesTable({ rates }: RatesTableProps) {
  return (
    <DataTableCard
      title="Tarifs par type"
      subtitle="Lisible et transparent pour savoir combien chaque format peut rapporter."
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Type</TableHead>
            <TableHead>Remuneration</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rates.map((rate) => (
            <TableRow key={rate.videoType}>
              <TableCell className="font-semibold">{rate.videoType}</TableCell>
              <TableCell className="font-medium">{formatCurrency(rate.ratePerVideo)}</TableCell>
              <TableCell>
                <StatusBadge
                  label={rate.isPlaceholder ? "A valider" : "Valide"}
                  tone={rate.isPlaceholder ? "warning" : "success"}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableCard>
  );
}
