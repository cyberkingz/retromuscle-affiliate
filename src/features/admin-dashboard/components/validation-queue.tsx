"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/context/auth-context";

interface ValidationQueueProps {
  rows: Array<{
    videoId: string;
    creatorHandle: string;
    videoType: string;
    fileUrl: string;
    uploadedAt: string;
    durationSeconds: number;
    resolution: string;
  }>;
}

export function ValidationQueue({ rows }: ValidationQueueProps) {
  const auth = useAuth();
  const router = useRouter();
  const accessToken = auth.session?.access_token ?? null;

  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function openPreview(fileUrl: string) {
    setError(null);

    if (!auth.client) {
      setError("Supabase n'est pas configure.");
      return;
    }

    const { data, error: signedError } = await auth.client.storage.from("videos").createSignedUrl(fileUrl, 60);
    if (signedError || !data?.signedUrl) {
      setError(signedError?.message ?? "Impossible de generer un lien de preview.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function review(videoId: string, decision: "approved" | "rejected", reason?: string | null) {
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    setSubmittingId(videoId);
    setError(null);

    try {
      const response = await fetch("/api/admin/videos/review", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          videoId,
          decision,
          rejectionReason: decision === "rejected" ? reason ?? null : null
        }),
        cache: "no-store"
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "Impossible de mettre a jour la video.");
      }

      setRejectingId(null);
      setRejectionReason("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible de mettre a jour la video.");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <Card className="bg-white p-5 sm:p-6">
      <p className="mb-3 text-xs uppercase tracking-[0.15em] text-foreground/50">File de validation</p>

      {error ? (
        <div
          className="mb-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-line bg-frost/70 px-4 py-6 text-sm text-foreground/70">
          Rien a valider pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const isSubmitting = submittingId === row.videoId;
            const isRejecting = rejectingId === row.videoId;

            return (
              <div key={row.videoId} className="rounded-2xl border border-line bg-frost/70 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {row.creatorHandle} · {row.videoType}
                    </p>
                    <p className="mt-1 text-xs text-foreground/65">
                      {row.durationSeconds}s · {row.resolution} · {new Date(row.uploadedAt).toLocaleString("fr-FR")}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openPreview(row.fileUrl)}
                      disabled={!auth.client}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Voir
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => review(row.videoId, "approved")}
                      disabled={isSubmitting || !accessToken}
                    >
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Valider
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={isRejecting ? "default" : "outline"}
                      onClick={() => {
                        setError(null);
                        setRejectingId((current) => (current === row.videoId ? null : row.videoId));
                        setRejectionReason("");
                      }}
                      disabled={isSubmitting}
                    >
                      <ThumbsDown className="mr-2 h-4 w-4" />
                      Rejeter
                    </Button>
                  </div>
                </div>

                {isRejecting ? (
                  <div className="mt-3 rounded-2xl border border-line bg-white/80 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Raison du rejet</p>
                    <Textarea
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      placeholder="Ex: Hook trop tard, format horizontal, sous-titres illisibles..."
                      className="mt-2"
                      rows={3}
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => review(row.videoId, "rejected", rejectionReason)}
                        disabled={isSubmitting || rejectionReason.trim().length === 0}
                      >
                        Confirmer le rejet
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectingId(null);
                          setRejectionReason("");
                        }}
                        disabled={isSubmitting}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
