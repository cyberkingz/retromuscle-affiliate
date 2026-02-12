"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, EyeOff, Play } from "lucide-react";

import type { AdminCreatorDetailData } from "@/application/use-cases/get-admin-creator-detail-data";
import { CardSection } from "@/components/layout/card-section";
import { DataTable } from "@/components/ui/data-table";
import { DataTableCard } from "@/components/ui/data-table-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { VideoPreviewModal } from "@/components/ui/video-preview-modal";
import { useVideoPreview } from "@/hooks/use-video-preview";
import type { PreviewItem } from "@/hooks/use-video-preview";
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
  creatorId: string;
}

export function AdminCreatorDetailPage({ data, creatorId }: AdminCreatorDetailPageProps) {
  const router = useRouter();
  const [showIban, setShowIban] = useState(false);

  const videoPreview = useVideoPreview("/api/videos/preview");
  const rushPreview = useVideoPreview("/api/rushes/preview");

  const payouts = data.trackings;
  const current = data.currentMonth;

  const hasContract = Boolean(data.contract.signedAt);

  const videoPreviewItems: PreviewItem[] = useMemo(
    () =>
      current?.videos.map((v) => ({
        id: v.id,
        fileUrl: v.fileUrl,
        videoType: v.videoType,
        resolution: v.resolution,
        durationSeconds: v.durationSeconds,
        fileSizeMb: v.fileSizeMb,
        status: v.status,
      })) ?? [],
    [current?.videos]
  );

  const rushPreviewItems: PreviewItem[] = useMemo(
    () =>
      current?.rushes
        .filter((r): r is typeof r & { fileUrl: string } => Boolean(r.fileUrl))
        .map((r) => ({
          id: r.id,
          fileUrl: r.fileUrl,
          fileName: r.fileName,
          fileSizeMb: r.fileSizeMb,
        })) ?? [],
    [current?.rushes]
  );

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
        cell: ({ row }) => {
          const item = videoPreviewItems.find((v) => v.id === row.original.id);
          return (
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (item) videoPreview.open(item, videoPreviewItems);
                }}
              >
                <Play className="mr-2 h-4 w-4" />
                Voir
              </Button>
            </div>
          );
        }
      }
    ],
    [videoPreviewItems, videoPreview]
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
        cell: ({ row }) => {
          const item = rushPreviewItems.find((r) => r.id === row.original.id);
          return (
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (item) rushPreview.open(item, rushPreviewItems);
                }}
                disabled={!row.original.fileUrl}
              >
                <Play className="mr-2 h-4 w-4" />
                Voir
              </Button>
            </div>
          );
        }
      }
    ],
    [rushPreviewItems, rushPreview]
  );

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Admin"
        title={`Createur ${data.creator.handle}`}
        subtitle="Profil, contrat, paiements, et contenus mensuels."
      />

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
                {data.contract.signatures.map((signature) => (
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

      {data.availableMonths.length > 0 ? (
        <CardSection className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Periode affichee (videos & rushes)</p>
            <select
              value={data.selectedMonth}
              onChange={(event) => {
                const month = event.target.value;
                router.push(`/admin/creators/${creatorId}?month=${month}`);
              }}
              className="h-9 rounded-xl border border-line bg-white px-3 text-sm capitalize"
            >
              {data.availableMonths.map((m) => (
                <option key={m} value={m}>
                  {monthToLabel(m)}
                </option>
              ))}
            </select>
          </div>
        </CardSection>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <DataTableCard
          title={`Uploads videos — ${monthToLabel(data.selectedMonth)}`}
          subtitle="Liste des videos upload par le createur."
        >
          <div className="p-5">
            {!current ? (
              <p className="rounded-2xl border border-line bg-frost/70 px-4 py-3 text-sm text-foreground/70">
                Aucun tracking pour cette periode.
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

        <DataTableCard
          title={`Rushes — ${monthToLabel(data.selectedMonth)}`}
          subtitle="Fichiers bruts upload (bonus)."
        >
          <div className="p-5">
            {!current ? (
              <p className="rounded-2xl border border-line bg-frost/70 px-4 py-3 text-sm text-foreground/70">
                Aucun tracking pour cette periode.
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

      <VideoPreviewModal preview={videoPreview} title="Preview Video" />
      <VideoPreviewModal preview={rushPreview} title="Preview Rush" />
    </div>
  );
}
