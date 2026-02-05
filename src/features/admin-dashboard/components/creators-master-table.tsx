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
import { creatorStatusTone } from "@/lib/status-tone";

interface CreatorsMasterTableProps {
  rows: Array<{
    creatorId: string;
    handle: string;
    email: string;
    country: string;
    packageTier: number;
    mixLabel: string;
    status: string;
  }>;
}

export function CreatorsMasterTable({ rows }: CreatorsMasterTableProps) {
  return (
    <DataTableCard title="Creators master" subtitle="Base createurs et statut de collaboration.">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Pays</TableHead>
            <TableHead>Package</TableHead>
            <TableHead>Mix</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.creatorId}>
              <TableCell className="font-semibold">{row.handle}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.country}</TableCell>
              <TableCell>Pack {row.packageTier}</TableCell>
              <TableCell>{row.mixLabel}</TableCell>
              <TableCell>
                <StatusBadge label={row.status} tone={creatorStatusTone(row.status)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableCard>
  );
}
