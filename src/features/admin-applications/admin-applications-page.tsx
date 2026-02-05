"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { AdminApplicationsData } from "@/application/use-cases/get-admin-applications-data";
import type { ApplicationStatus, CreatorApplication } from "@/domain/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTableCard } from "@/components/ui/data-table-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/context/auth-context";
import { toShortDate } from "@/lib/date";

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
    () => applications.filter((application) => application.status === filter).sort(sortApplications),
    [applications, filter]
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
    if (!auth.session?.access_token) {
      setErrorMessage("Session manquante. Reconnecte-toi.");
      return;
    }
    if (!selected) {
      setErrorMessage("Selection manquante.");
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/applications/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.session.access_token}`
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

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <DataTableCard
          title="Dossiers"
          subtitle="Clique sur un dossier pour voir le detail et valider."
          className="min-w-0"
        >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Createur</TableHead>
                <TableHead>Pack</TableHead>
                <TableHead>Followers</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Soumis</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-foreground/60">
                    Aucun dossier dans cette vue.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((application) => {
                  const isSelected = application.userId === selectedUserId;
                  return (
                    <TableRow
                      key={application.userId}
                      className={isSelected ? "bg-frost/70 hover:bg-frost/70" : undefined}
                      onClick={() => selectApplication(application.userId)}
                      style={{ cursor: "pointer" }}
                    >
                      <TableCell className="font-semibold">
                        {application.handle}
                        <div className="text-xs font-normal text-foreground/60">{application.fullName}</div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {application.packageTier} • {application.mixName}
                      </TableCell>
                      <TableCell>{application.followers.toLocaleString("fr-FR")}</TableCell>
                      <TableCell>{application.country}</TableCell>
                      <TableCell>{application.submittedAt ? toShortDate(application.submittedAt) : "-"}</TableCell>
                      <TableCell>
                        <StatusBadge label={statusLabel(application.status)} tone={statusTone(application.status)} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
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
                  {selected.portfolioUrl ? (
                    <a
                      className="underline underline-offset-4"
                      href={selected.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Portfolio
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
