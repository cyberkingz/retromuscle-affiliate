"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, Eye, EyeOff } from "lucide-react";

import type { AdminCreatorDetailData } from "@/application/use-cases/get-admin-creator-detail-data";
import { CardSection } from "@/components/layout/card-section";
import { DataTable } from "@/components/ui/data-table";
import { DataTableCard } from "@/components/ui/data-table-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { monthToLabel, toShortDate } from "@/lib/date";
import { paymentStatusTone, videoStatusTone } from "@/lib/status-tone";

function maskIban(value: string): string {
  const clean = value.replace(/\s+/g, "");
  if (clean.length <= 8) return value;
  return `${clean.slice(0, 4)} **** **** **** ${clean.slice(-4)}`;
}

interface AdminCreatorDetailPageProps {
  data: AdminCreatorDetailData;
}

export function AdminCreatorDetailPage({ data }: AdminCreatorDetailPageProps) {
  const [showIban, setShowIban] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payouts = data.trackings;
  const current = data.currentMonth;

  const hasContract = Boolean(data.contract.signedAt);

  async function openVideoPreview(fileUrl: string) {
    setError(null);
    try {
      const response = await fetch(`/api/videos/preview?fileUrl=${encodeURIComponent(fileUrl)}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { signedUrl?: string; message?: string } | null;
      if (!response.ok || !payload?.signedUrl) {
        throw new Error(payload?.message ?? "Impossible de generer un lien de preview.");
      }
      window.open(payload.signedUrl, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible de generer un lien de preview.");
    }
  }

  async function openRushPreview(fileUrl: string) {
    setError(null);
    try {
      const response = await fetch(`/api/rushes/preview?fileUrl=${encodeURIComponent(fileUrl)}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { signedUrl?: string; message?: string } | null;
      if (!response.ok || !payload?.signedUrl) {
        throw new Error(payload?.message ?? "Impossible de generer un lien de preview.");
      }
      window.open(payload.signedUrl, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible de generer un lien de preview.");
    }
  }

  const trackingColumns = useMemo<ColumnDef<(typeof payouts)[number]>[]>(
    () => [
      {
        id: "month",
        header: "Mois",
        accessorFn: (row) => row.month,
        cell: ({ row }) => <span className="font-semibold capitalize">{monthToLabel(row.original.month)}</span>
      },
      {
        id: "plan",
        header: "Plan",
        accessorFn: (row) => `${row.packageTier}-${row.mixLabel}`,
        cell: ({ row }) => (
          <span className="text-sm">
            Pack {row.original.packageTier} • {row.original.mixLabel}
          </span>
        )
      },
      {
        id: "delivered",
        header: "Livrees",
        accessorFn: (row) => row.deliveredTotal,
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.deliveredTotal}/{row.original.quotaTotal}
          </span>
        )
      },
      {
        id: "payout",
        header: "Montant",
        accessorFn: (row) => row.payoutAmount,
        cell: ({ row }) => <span className="font-semibold text-secondary">{formatCurrency(row.original.payoutAmount)}</span>
      },
      {
        id: "status",
        header: "Paiement",
        accessorFn: (row) => row.paymentStatus,
        cell: ({ row }) => (
          <div className="space-y-1">
            <StatusBadge label={row.original.paymentStatus} tone={paymentStatusTone(row.original.paymentStatus)} />
            <p className="text-xs text-foreground/60">{row.original.paidAt ? toShortDate(row.original.paidAt) : "-"}</p>
          </div>
        )
      }
    ],
    []
  );

  const videoColumns = useMemo<ColumnDef<NonNullable<AdminCreatorDetailData["currentMonth"]>["videos"][number]>[]>(
    () => [
      {
        id: "type",
        header: "Type",
        accessorFn: (row) => row.videoType,
        cell: ({ row }) => <span className="font-semibold">{row.original.videoType}</span>
      },
      {
        id: "status",
        header: "Statut",
        accessorFn: (row) => row.status,
        cell: ({ row }) => <StatusBadge label={row.original.status} tone={videoStatusTone(row.original.status)} />
      },
      {
        id: "meta",
        header: "Meta",
        accessorFn: (row) => row.createdAt,
        cell: ({ row }) => (
          <div className="text-xs text-foreground/65">
            {row.original.durationSeconds}s • {row.original.resolution} • {row.original.fileSizeMb}MB
            <div>{new Date(row.original.createdAt).toLocaleString("fr-FR")}</div>
            {row.original.rejectionReason ? (
              <div className="mt-2 text-destructive">Rejet: {row.original.rejectionReason}</div>
            ) : null}
          </div>
        )
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void openVideoPreview(row.original.fileUrl)}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir
            </Button>
          </div>
        )
      }
    ],
    []
  );

  const rushColumns = useMemo<ColumnDef<NonNullable<AdminCreatorDetailData["currentMonth"]>["rushes"][number]>[]>(
    () => [
      {
        id: "file",
        header: "Fichier",
        accessorFn: (row) => row.fileName,
        cell: ({ row }) => <span className="font-semibold">{row.original.fileName}</span>
      },
      {
        id: "meta",
        header: "Meta",
        accessorFn: (row) => row.createdAt,
        cell: ({ row }) => (
          <div className="text-xs text-foreground/65">
            {row.original.fileSizeMb}MB
            <div>{new Date(row.original.createdAt).toLocaleString("fr-FR")}</div>
          </div>
        )
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => (row.original.fileUrl ? void openRushPreview(row.original.fileUrl) : undefined)}
              disabled={!row.original.fileUrl}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir
            </Button>
          </div>
        )
      }
    ],
    []
  );

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Admin"
        title={`Createur ${data.creator.handle}`}
        subtitle="Profil, contrat, paiements, et contenus du mois en cours."
      />

      {error ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <CardSection className="space-y-4 lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Profil</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-foreground/60">Nom</p>
              <p className="font-semibold">{data.creator.displayName}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Email</p>
              <p className="font-semibold">{data.creator.email}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">WhatsApp</p>
              <p className="font-semibold">{data.creator.whatsapp}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Pays</p>
              <p className="font-semibold">{data.creator.country}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-foreground/60">Adresse</p>
              <p className="font-semibold">{data.creator.address}</p>
            </div>
          </div>

          {data.creator.notes ? (
            <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3 text-sm text-foreground/75">
              <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Notes</p>
              <p className="mt-2">{data.creator.notes}</p>
            </div>
          ) : null}
        </CardSection>

        <CardSection className="space-y-4">
          <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Contrat</p>
          <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3">
            <p className="text-sm font-semibold">{hasContract ? "Signe" : "Non signe"}</p>
            <p className="mt-1 text-xs text-foreground/60">{data.contract.signedAt ? toShortDate(data.contract.signedAt) : "-"}</p>
          </div>
          <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3 text-xs text-foreground/65">
            {data.contract.signatures.length} signature(s) enregistree(s).
          </div>
        </CardSection>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CardSection className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Paiement</p>
              <p className="mt-2 text-sm text-foreground/75">Coordonnees pour payer ce createur.</p>
            </div>
            {data.payoutProfile ? (
              <div className="rounded-full border border-line bg-frost/70 px-3 py-1 text-xs text-foreground/70">
                Update {new Date(data.payoutProfile.updatedAt).toLocaleDateString("fr-FR")}
              </div>
            ) : null}
          </div>

          {!data.payoutProfile ? (
            <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3 text-sm text-foreground/70">
              Aucun profil de paiement.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-foreground/60">Methode</p>
                  <p className="font-semibold uppercase">{data.payoutProfile.method}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground/60">Titulaire</p>
                  <p className="font-semibold">{data.payoutProfile.accountHolderName ?? "-"}</p>
                </div>
              </div>

              {data.payoutProfile.iban ? (
                <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">IBAN</p>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowIban((v) => !v)}>
                      {showIban ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                      {showIban ? "Masquer" : "Afficher"}
                    </Button>
                  </div>
                  <p className="mt-2 font-mono text-sm">{showIban ? data.payoutProfile.iban : maskIban(data.payoutProfile.iban)}</p>
                </div>
              ) : null}

              {data.payoutProfile.paypalEmail ? (
                <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">PayPal</p>
                  <p className="mt-2 font-mono text-sm">{data.payoutProfile.paypalEmail}</p>
                </div>
              ) : null}

              {data.payoutProfile.stripeAccount ? (
                <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Stripe</p>
                  <p className="mt-2 font-mono text-sm">{data.payoutProfile.stripeAccount}</p>
                </div>
              ) : null}
            </div>
          )}
        </CardSection>

        <DataTableCard title="Historique contrat" subtitle="Signatures et version de contrat (trace).">
          <div className="px-5 pb-5">
            {data.contract.signatures.length === 0 ? (
              <p className="rounded-2xl border border-line bg-frost/70 px-4 py-3 text-sm text-foreground/70">
                Aucune signature.
              </p>
            ) : (
              <div className="space-y-2">
                {data.contract.signatures.slice(0, 6).map((signature) => (
                  <div key={signature.id} className="rounded-2xl border border-line bg-frost/70 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{signature.contractVersion}</p>
                      <p className="text-xs text-foreground/60">{toShortDate(signature.signedAt)}</p>
                    </div>
                    <p className="mt-1 text-xs text-foreground/65">
                      {signature.signerName} {signature.ip ? `• ${signature.ip}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DataTableCard>
      </div>

      <DataTableCard title="Trackings mensuels" subtitle="Synthese quotas / livraisons / paiements.">
        <div className="p-5">
          <DataTable
            data={payouts}
            columns={trackingColumns}
            pageSize={8}
            emptyMessage="Aucun tracking."
            getRowId={(row) => row.id}
            renderMobileRow={(row) => (
              <div className="rounded-2xl border border-line bg-white/95 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold capitalize">{monthToLabel(row.month)}</p>
                    <p className="text-xs text-foreground/60">
                      Pack {row.packageTier} • {row.mixLabel}
                    </p>
                  </div>
                  <StatusBadge label={row.paymentStatus} tone={paymentStatusTone(row.paymentStatus)} />
                </div>
                <div className="flex items-center justify-between text-sm text-foreground/75">
                  <span>Livrees</span>
                  <span className="font-medium">
                    {row.deliveredTotal}/{row.quotaTotal}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-foreground/75">
                  <span>Montant</span>
                  <span className="font-semibold">{formatCurrency(row.payoutAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-foreground/60">
                  <span>Deadline</span>
                  <span>{toShortDate(row.deadline)}</span>
                </div>
              </div>
            )}
          />
        </div>
      </DataTableCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <DataTableCard title="Uploads videos (mois en cours)" subtitle="Liste des videos upload par le createur.">
          <div className="p-5">
            {!current ? (
              <p className="rounded-2xl border border-line bg-frost/70 px-4 py-3 text-sm text-foreground/70">
                Aucun tracking actif.
              </p>
            ) : (
              <DataTable
                data={current.videos}
                columns={videoColumns}
                pageSize={6}
                emptyMessage="Aucune video."
                getRowId={(row) => row.id}
              />
            )}
          </div>
        </DataTableCard>

        <DataTableCard title="Rushes (mois en cours)" subtitle="Fichiers bruts upload (bonus).">
          <div className="p-5">
            {!current ? (
              <p className="rounded-2xl border border-line bg-frost/70 px-4 py-3 text-sm text-foreground/70">
                Aucun tracking actif.
              </p>
            ) : (
              <DataTable
                data={current.rushes}
                columns={rushColumns}
                pageSize={6}
                emptyMessage="Aucun rush."
                getRowId={(row) => row.id}
              />
            )}
          </div>
        </DataTableCard>
      </div>
    </div>
  );
}

