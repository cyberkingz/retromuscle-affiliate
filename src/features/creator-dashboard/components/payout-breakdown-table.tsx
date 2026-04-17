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
  if (items.length === 0) {
    return (
      <p className="py-2 text-[12px] text-foreground/40">
        Aucune vidéo validée ce mois-ci.
      </p>
    );
  }

  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr>
          <th className="pb-2 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-foreground/40">
            Type
          </th>
          <th className="pb-2 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-foreground/40">
            Validées
          </th>
          <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-[0.12em] text-foreground/40">
            Tarif
          </th>
          <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-[0.12em] text-foreground/40">
            Sous-total
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr
            key={item.key}
            style={
              i < items.length - 1
                ? { borderTop: "1px solid hsl(227 78% 12% / 0.07)" }
                : { borderTop: "1px solid hsl(227 78% 12% / 0.07)" }
            }
          >
            <td className="py-2 font-semibold text-foreground/75">{item.label}</td>
            <td className="py-2 text-center text-foreground/60">{item.delivered}</td>
            <td className="py-2 text-right text-foreground/50">{formatCurrency(item.rate)}</td>
            <td className="py-2 text-right font-bold text-secondary">
              {formatCurrency(item.subtotal)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
