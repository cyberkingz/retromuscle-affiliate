"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import type { AdminApplicationsData } from "@/application/use-cases/get-admin-applications-data";
import type { ApplicationStatus, CreatorApplication } from "@/domain/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTableCard } from "@/components/ui/data-table-card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/context/auth-context";
import { toShortDate } from "@/lib/date";
import { cn } from "@/lib/cn";

type Decision = "approved" | "rejected";

function statusLabel(status: ApplicationStatus): string {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "pending_review":
      return "A traiter";
    case "approved":
      return "Approuve";
    case "rejected":
      return "Refuse";
    default:
      return status;
  }
}

function statusTone(status: ApplicationStatus): "neutral" | "success" | "warning" {
  switch (status) {
    case "approved":
      return "success";
    case "pending_review":
      return "warning";
    default:
      return "neutral";
  }
}

function sortApplications(a: CreatorApplication, b: CreatorApplication): number {
  const aDate = a.submittedAt ?? a.createdAt;
  const bDate = b.submittedAt ?? b.createdAt;
  return bDate.localeCompare(aDate);
}

function resolveDefaultFilter(applications: CreatorApplication[]): ApplicationStatus {
  return applications.some((item) => item.status === "pending_review") ? "pending_review" : "draft";
}

interface AdminApplicationsPageProps {
  data: AdminApplicationsData;
}

export function AdminApplicationsPage({ data }: AdminApplicationsPageProps) {
  const auth = useAuth();
  const [applications, setApplications] = useState(() => [...data.applications].sort(sortApplications));
  const [filter, setFilter] = useState<ApplicationStatus>(() => resolveDefaultFilter(data.applications));
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(() => data.applications[0]?.userId ?? null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastApproval, setLastApproval] = useState<{ creatorId: string } | null>(null);

  const counts = useMemo(() => {
    return applications.reduce<Record<ApplicationStatus, number>>(
      (acc, application) => {
        acc[application.status] = (acc[application.status] ?? 0) + 1;
        return acc;
      },
      { draft: 0, pending_review: 0, approved: 0, rejected: 0 }
    );
  }, [applications]);

  const filtered = useMemo(
    () => {
      const needle = search.trim().toLowerCase();
      return applications
        .filter((application) => application.status === filter)
        .filter((application) => {
          if (!needle) return true;
          return (
            application.handle.toLowerCase().includes(needle) ||
            application.email.toLowerCase().includes(needle) ||
            application.fullName.toLowerCase().includes(needle)
          );
        })
        .sort(sortApplications);
    },
    [applications, filter, search]
  );

  const columns = useMemo<ColumnDef<CreatorApplication>[]>(
    () => [
      {
        id: "creator",
        header: "Createur",
        accessorFn: (row) => row.handle,
        cell: ({ row }) => {
          const application = row.original;
          return (
            <div className="min-w-[180px]">
              <p className="font-semibold">{application.handle}</p>
              <p className="text-xs text-foreground/60">{application.fullName}</p>
            </div>
          );
        }
      },
      {
        id: "plan",
        header: "Pack",
        accessorFn: (row) => `${row.packageTier}-${row.mixName}`,
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.packageTier} • {row.original.mixName}
          </span>
        )
      },
      {
        accessorKey: "followers",
        header: "Followers",
        cell: ({ row }) => row.original.followers.toLocaleString("fr-FR")
      },
      {
        accessorKey: "country",
        header: "Pays"
      },
      {
        id: "submitted",
        header: "Soumis",
        accessorFn: (row) => row.submittedAt ?? row.createdAt,
        cell: ({ row }) => (row.original.submittedAt ? toShortDate(row.original.submittedAt) : "-")
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => (
          <StatusBadge label={statusLabel(row.original.status)} tone={statusTone(row.original.status)} />
        )
      }
    ],
    []
  );

  const selected = useMemo(
    () => applications.find((application) => application.userId === selectedUserId) ?? null,
    [applications, selectedUserId]
  );

  function selectApplication(userId: string, source?: CreatorApplication[]) {
    const pool = source ?? applications;
    setSelectedUserId(userId);
    const target = pool.find((application) => application.userId === userId);
    setReviewNotes(target?.reviewNotes ?? "");
    setLastApproval(null);
    setStatusMessage(null);
    setErrorMessage(null);
  }

  async function submitDecision(decision: Decision) {
    if (!auth.user) {
      setErrorMessage("Session manquante. Reconnecte-toi.");
      return;
    }
    if (!selected) {
      setErrorMessage("Selection manquante.");
      return;
    }
    if (decision === "rejected" && reviewNotes.trim().length === 0) {
      setErrorMessage("Ajoute une note de review pour expliquer le refus.");
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/applications/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: selected.userId,
          decision,
          reviewNotes: reviewNotes.trim() || null
        })
      });

      const payload = (await response.json()) as
        | {
            application?: CreatorApplication;
            creatorId?: string;
            message?: string;
          }
        | {
            message?: string;
          };

      if (!response.ok || !("application" in payload) || !payload.application) {
        throw new Error(("message" in payload && payload.message) ? payload.message : "Erreur review candidature");
      }

      const nextApplications = applications.map((item) =>
        item.userId === payload.application!.userId ? payload.application! : item
      );
      setApplications(nextApplications);

      if (decision === "approved") {
        setLastApproval(payload.creatorId ? { creatorId: payload.creatorId } : null);
        setStatusMessage("Candidature approuvee. Le compte peut maintenant acceder au dashboard.");
      } else {
        setStatusMessage("Candidature refusee. Le createur verra ton feedback.");
      }

      if (filter === "pending_review") {
        const remaining = nextApplications.filter(
          (item) => item.status === "pending_review" && item.userId !== selected.userId
        );
        if (remaining.length > 0) {
          selectApplication(remaining[0]!.userId, nextApplications);
        } else {
          setSelectedUserId(null);
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erreur review candidature");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Admin"
        title="Candidatures createurs"
        subtitle="Valide les dossiers, ajoute un feedback clair, et declenche l'acces au dashboard."
      />

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { key: "pending_review", label: "A traiter" },
            { key: "approved", label: "Approuvees" },
            { key: "rejected", label: "Refusees" },
            { key: "draft", label: "Brouillons" }
          ] as const
        ).map((item) => (
          <Button
            key={item.key}
            type="button"
            size="pill"
            variant={filter === item.key ? "default" : "outline"}
            onClick={() => setFilter(item.key)}
          >
            {item.label} ({counts[item.key]})
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Recherche (handle, email, nom)..."
          className="h-10 w-full sm:w-[320px]"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <DataTableCard
          title="Dossiers"
          subtitle="Clique sur un dossier pour voir le detail et valider."
          className="min-w-0"
        >
          <DataTable
            data={filtered}
            columns={columns}
            pageSize={10}
            emptyMessage="Aucun dossier dans cette vue."
            getRowId={(row) => row.userId}
            onRowClick={(row) => selectApplication(row.userId)}
            isRowSelected={(row) => row.userId === selectedUserId}
            renderMobileRow={(row) => {
              const isSelected = row.userId === selectedUserId;
              return (
                <Card
                  className={cn(
                    "space-y-3 bg-white/95 p-4",
                    isSelected ? "border-secondary/40 shadow-[0_18px_40px_-22px_rgba(8,17,66,0.55)]" : undefined
                  )}
                  onClick={() => selectApplication(row.userId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectApplication(row.userId);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{row.handle}</p>
                      <p className="text-xs text-foreground/60">{row.fullName}</p>
                    </div>
                    <StatusBadge label={statusLabel(row.status)} tone={statusTone(row.status)} />
                  </div>
                  <div className="grid gap-1 text-sm text-foreground/75">
                    <p>
                      {row.packageTier} • {row.mixName}
                    </p>
                    <p>{row.followers.toLocaleString("fr-FR")} followers</p>
                    <p>
                      {row.country} • {row.submittedAt ? toShortDate(row.submittedAt) : "Brouillon"}
                    </p>
                  </div>
                </Card>
              );
            }}
          />
        </DataTableCard>

        <Card className="space-y-4 bg-white/95 p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Detail dossier</p>

          {!selected ? (
            <p className="text-sm text-foreground/70">Selectionne un dossier pour afficher les details.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-frost/65 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-3xl uppercase leading-none">{selected.handle}</p>
                    <p className="text-sm text-foreground/70">{selected.fullName}</p>
                  </div>
                  <StatusBadge label={statusLabel(selected.status)} tone={statusTone(selected.status)} />
                </div>
                <div className="mt-3 grid gap-2 text-sm text-foreground/75">
                  <p>Email: {selected.email}</p>
                  <p>WhatsApp: {selected.whatsapp}</p>
                  <p>Pays: {selected.country}</p>
                  <p>Pack: {selected.packageTier} • Mix: {selected.mixName}</p>
                  <p>Followers: {selected.followers.toLocaleString("fr-FR")}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Liens</p>
                <div className="grid gap-2 text-sm">
                  {selected.socialTiktok ? (
                    <a
                      className="underline underline-offset-4"
                      href={selected.socialTiktok}
                      target="_blank"
                      rel="noreferrer"
                    >
                      TikTok
                    </a>
                  ) : null}
                  {selected.socialInstagram ? (
                    <a
                      className="underline underline-offset-4"
                      href={selected.socialInstagram}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Instagram
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">
                  Notes de review (visible createur)
                </p>
                <Textarea
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  placeholder="Ex: Super fit. Pour la premiere mission, prioriser OOTD + before/after."
                  rows={5}
                  disabled={submitting || selected.status === "approved" || selected.status === "rejected"}
                />
              </div>

              {errorMessage ? (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              ) : null}
              {statusMessage ? <p className="text-sm text-mint">{statusMessage}</p> : null}

              {selected.status === "pending_review" ? (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="pill" disabled={submitting} onClick={() => submitDecision("approved")}>
                    {submitting ? "..." : "Approuver"}
                  </Button>
                  <Button
                    type="button"
                    size="pill"
                    variant="outline"
                    disabled={submitting}
                    onClick={() => submitDecision("rejected")}
                  >
                    {submitting ? "..." : "Refuser"}
                  </Button>
                </div>
              ) : null}

              {selected.status === "approved" && lastApproval?.creatorId ? (
                <Button asChild size="pill" variant="outline">
                  <Link
                    href={{
                      pathname: "/dashboard",
                      query: {
                        creator: lastApproval.creatorId
                      }
                    }}
                  >
                    Voir le dashboard
                  </Link>
                </Button>
              ) : null}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
