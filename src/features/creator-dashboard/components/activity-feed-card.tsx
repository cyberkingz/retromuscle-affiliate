import { CheckCircle2, Clock, MessageSquareDiff, UploadCloud, XCircle, Film, Banknote, FileText } from "lucide-react";

type ActivityItem = {
  id: string;
  kind: "upload" | "approved" | "rejected" | "revision_requested" | "rush" | "paid" | "contract";
  title: string;
  detail?: string;
  timestamp: string;
  tone: "neutral" | "success" | "warning";
};

function DotFor({ tone }: { tone: ActivityItem["tone"] }) {
  if (tone === "success") return <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />;
  if (tone === "warning") return <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />;
  return <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/20" />;
}

function IconFor({ kind }: { kind: ActivityItem["kind"] }) {
  const cls = "h-3.5 w-3.5 shrink-0";
  switch (kind) {
    case "approved":           return <CheckCircle2 className={`${cls} text-mint`} />;
    case "paid":               return <Banknote className={`${cls} text-mint`} />;
    case "contract":           return <FileText className={`${cls} text-mint`} />;
    case "rejected":           return <XCircle className={`${cls} text-destructive/70`} />;
    case "revision_requested": return <MessageSquareDiff className={`${cls} text-amber-500`} />;
    case "rush":               return <Film className={`${cls} text-secondary/60`} />;
    default:                   return <UploadCloud className={`${cls} text-secondary/60`} />;
  }
}

function formatTs(ts: string): string {
  return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

interface ActivityFeedCardProps {
  items: ActivityItem[];
}

export function ActivityFeedCard({ items }: ActivityFeedCardProps) {
  return (
    <div className="rounded-[22px] border border-line bg-white/85 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/55">
          Activité récente
        </p>
        <Clock className="h-3 w-3 text-foreground/30" />
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-center text-[12px] text-foreground/40">
          Aucune activité pour ce mois.
        </p>
      ) : (
        <div className="space-y-0">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="flex items-start gap-3 py-2.5"
              style={
                i < items.length - 1
                  ? { borderBottom: "1px solid hsl(227 78% 12% / 0.07)" }
                  : undefined
              }
            >
              <IconFor kind={item.kind} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold leading-snug text-foreground/80">
                  {item.title}
                </p>
                {item.detail && (
                  <p className="mt-0.5 truncate text-[11px] text-foreground/45">{item.detail}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <DotFor tone={item.tone} />
                <span className="text-[10px] text-foreground/35">{formatTs(item.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
