import { Card } from "@/components/ui/card";

interface UploadCardProps {
  specs: string[];
  tips: string[];
  pendingReviewCount: number;
  rejectedCount: number;
}

export function UploadCard({ specs, tips, pendingReviewCount, rejectedCount }: UploadCardProps) {
  return (
    <Card className="space-y-4 bg-white p-5 sm:p-6">
      <p className="text-xs uppercase tracking-[0.15em] text-foreground/50">Upload categorie active</p>
      <div className="rounded-xl border border-dashed border-foreground/25 bg-frost/80 px-4 py-8 text-center text-sm text-foreground/65">
        Zone de drop upload (a connecter a Supabase Storage)
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-foreground/50">Specs requises</p>
          <ul className="space-y-1 text-sm text-foreground/70">
            {specs.map((spec) => (
              <li key={spec}>- {spec}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-foreground/50">Tips Cinematic</p>
          <ul className="space-y-1 text-sm text-foreground/70">
            {tips.map((tip) => (
              <li key={tip}>- {tip}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <p className="rounded-lg bg-frost px-3 py-2">A valider: {pendingReviewCount}</p>
        <p className="rounded-lg bg-frost px-3 py-2">Rejetees: {rejectedCount}</p>
      </div>
    </Card>
  );
}
