"use client";

import { FileText } from "lucide-react";
import { CardSection } from "@/components/layout/card-section";
import { Button } from "@/components/ui/button";
import { useResourceDownload } from "@/features/creator-resources/hooks/use-resource-download";
import type { PublicResource } from "@/domain/types";

function formatFileSize(bytes: number | null): string | null {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

interface ResourceCardProps {
  resource: PublicResource;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const { isLoading, error, download } = useResourceDownload(resource.id);
  const fileSize = formatFileSize(resource.fileSizeBytes);

  return (
    <CardSection tone="frost" padding="md" className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-snug text-foreground">{resource.title}</h3>
          {resource.description && (
            <p className="mt-1 line-clamp-2 text-xs text-foreground/60">{resource.description}</p>
          )}
          {fileSize && <p className="mt-1 text-[11px] text-foreground/40">{fileSize}</p>}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button
        size="sm"
        variant="outline"
        className="w-full"
        disabled={isLoading || !resource.fileName}
        onClick={() => void download()}
      >
        {isLoading ? "Chargement…" : "Télécharger le guide"}
      </Button>
    </CardSection>
  );
}
