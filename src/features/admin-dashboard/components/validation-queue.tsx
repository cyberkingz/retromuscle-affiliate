import { Card } from "@/components/ui/card";

interface ValidationQueueProps {
  rows: Array<{
    videoId: string;
    creatorHandle: string;
    videoType: string;
    uploadedAt: string;
    durationSeconds: number;
    resolution: string;
  }>;
}

export function ValidationQueue({ rows }: ValidationQueueProps) {
  return (
    <Card className="bg-white p-5 sm:p-6">
      <p className="mb-3 text-xs uppercase tracking-[0.15em] text-foreground/50">File de validation</p>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.videoId} className="rounded-xl border border-line/70 bg-frost px-3 py-2.5 text-sm">
            <p className="font-medium">
              {row.creatorHandle} - {row.videoType}
            </p>
            <p className="text-xs text-foreground/65">
              {row.durationSeconds}s | {row.resolution} | {new Date(row.uploadedAt).toLocaleString("fr-FR")}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
