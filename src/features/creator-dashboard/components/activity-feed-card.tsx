import { CardSection } from "@/components/layout/card-section";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, UploadCloud, XCircle, Film } from "lucide-react";

type ActivityItem = {
  id: string;
  kind: "upload" | "approved" | "rejected" | "rush" | "paid" | "contract";
  title: string;
  detail?: string;
  timestamp: string;
  tone: "neutral" | "success" | "warning";
};

function iconFor(kind: ActivityItem["kind"]) {
  switch (kind) {
    case "approved":
    case "paid":
    case "contract":
      return <CheckCircle2 className="h-4 w-4 text-mint" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-destructive/80" />;
    case "rush":
      return <Film className="h-4 w-4 text-secondary" />;
    case "upload":
    default:
      return <UploadCloud className="h-4 w-4 text-secondary" />;
  }
}

function badgeFor(tone: ActivityItem["tone"]) {
  if (tone === "success") return <Badge className="bg-mint/15 text-mint border-mint/20" variant="outline">OK</Badge>;
  if (tone === "warning") return <Badge className="bg-primary/15 text-primary border-primary/25" variant="outline">A corriger</Badge>;
  return <Badge className="bg-frost text-foreground/70 border-line" variant="outline">Info</Badge>;
}

interface ActivityFeedCardProps {
  items: ActivityItem[];
}

export function ActivityFeedCard({ items }: ActivityFeedCardProps) {
  return (
    <CardSection className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-foreground/50">Activite recente</p>
          <p className="mt-2 text-sm text-foreground/75">
            Uploads, validations, rejets et paiements.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground/60">
          <Clock className="h-4 w-4" />
          Dernieres 12 actions
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-frost/70 px-4 py-6 text-sm text-foreground/70">
          Aucune activite pour ce cycle.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-frost/70 px-4 py-3"
            >
              <div className="flex min-w-0 gap-3">
                <div className="mt-0.5">{iconFor(item.kind)}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  {item.detail ? (
                    <p className="mt-1 text-xs text-foreground/65">{item.detail}</p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-foreground/55">
                    {new Date(item.timestamp).toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>
              <div className="shrink-0">{badgeFor(item.tone)}</div>
            </div>
          ))}
        </div>
      )}
    </CardSection>
  );
}

