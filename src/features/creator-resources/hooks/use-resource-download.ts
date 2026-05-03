"use client";

import { useState } from "react";

export function useResourceDownload(id: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/resources/${id}/download-url`);
      if (!res.ok) {
        throw new Error("Impossible de générer le lien de téléchargement.");
      }
      const { url } = (await res.json()) as { url: string };
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Erreur lors du téléchargement. Réessaie dans un instant.");
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, error, download };
}
