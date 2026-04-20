import { AlertTriangle } from "lucide-react";

interface AdminInstructionsCardProps {
  note: string;
}

export function AdminInstructionsCard({ note }: AdminInstructionsCardProps) {
  return (
    <div className="rounded-2xl border border-amber-300/60 bg-amber-50 px-5 py-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
          Modifications demandées
        </p>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-amber-900">{note}</p>
    </div>
  );
}
