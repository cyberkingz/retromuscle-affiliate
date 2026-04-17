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

// ---------------------------------------------------------------------------
// Review message templates
// ---------------------------------------------------------------------------
const REVIEW_TEMPLATES: Array<{ label: string; text: string; tone: "approve" | "reject" }> = [
  // Approve
  {
    label: "✅ Bienvenue !",
    tone: "approve",
    text: "Bienvenue dans l'équipe RetroMuscle 🔥 On a adoré ton profil, t'as exactement le vibe qu'on cherche. Signe ton contrat (scroll tout en bas du contrat pour pouvoir le signer) et on te prépare ton kit créateur !"
  },
  {
    label: "✅ Trop fort·e",
    tone: "approve",
    text: "Waouh, ton contenu est vraiment top 🙌 On est super heureux·se de t'avoir avec nous. Bienvenue dans la famille RetroMuscle — hâte de voir ce que tu vas créer !"
  },
  {
    label: "✅ Parfait pour nous",
    tone: "approve",
    text: "Ton profil colle parfaitement à l'univers RetroMuscle 💪 Bienvenue ! Signe ton contrat pour débloquer ton accès et ton code kit créateur."
  },
  // Reject
  {
    label: "❌ Pas encore",
    tone: "reject",
    text: "Merci d'avoir postulé ! Pour l'instant ton profil n'atteint pas encore le seuil qu'on s'est fixé, mais ça peut changer vite — reviens quand ta communauté aura grandi, on sera là 🙏"
  },
  {
    label: "❌ Mauvaise niche",
    tone: "reject",
    text: "Merci pour ta candidature ! RetroMuscle c'est vraiment centré sur le fitness et le sportswear rétro, et ton contenu s'éloigne un peu de ça pour l'instant. On reste ouverts si ça évolue 💙"
  },
  {
    label: "❌ Profil trop récent",
    tone: "reject",
    text: "Merci d'avoir postulé ! Ton compte est encore récent et on préfère attendre que tu aies plus de contenu posté avant de t'intégrer. N'hésite pas à revenir dans quelques mois !"
  },
  {
    label: "❌ Style différent",
    tone: "reject",
    text: "Merci pour l'intérêt que tu portes à RetroMuscle ! Ton style est sympa mais ne colle pas encore à notre esthétique pour l'instant. On te souhaite plein de succès dans ta créa 🤙"
  }
];

function statusLabel(status: ApplicationStatus): string {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "pending_review":
      return "A traiter";
    case "approved":
      return "Approuvé";
    case "rejected":
      return "Refusé";
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
  const [applications, setApplications] = useState(() =>
    [...data.applications].sort(sortApplications)
  );
  const [filter, setFilter] = useState<ApplicationStatus>(() =>
    resolveDefaultFilter(data.applications)
  );
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    () => data.applications[0]?.userId ?? null
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastApproval, setLastApproval] = useState<{ creatorId: string } | null>(null);

  // ── Bulk selection ────────────────────────────────────────────────────────
  const [checkedUserIds, setCheckedUserIds] = useState<Set<string>>(new Set());
  const [bulkNotes, setBulkNotes] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const counts = useMemo(() => {
    return applications.reduce<Record<ApplicationStatus, number>>(
      (acc, application) => {
        acc[application.status] = (acc[application.status] ?? 0) + 1;
        return acc;
      },
      { draft: 0, pending_review: 0, approved: 0, rejected: 0 }
    );
  }, [applications]);

  const filtered = useMemo(() => {
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
  }, [applications, filter, search]);

  const pendingFiltered = useMemo(
    () => filtered.filter((a) => a.status === "pending_review"),
    [filtered]
  );

  const allPendingChecked =
    pendingFiltered.length > 0 && pendingFiltered.every((a) => checkedUserIds.has(a.userId));
  const somePendingChecked =
    !allPendingChecked && pendingFiltered.some((a) => checkedUserIds.has(a.userId));

  const columns = useMemo<ColumnDef<CreatorApplication>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: () =>
          filter === "pending_review" ? (
            <input
              type="checkbox"
              className="h-4 w-4 accent-secondary"
              checked={allPendingChecked}
              ref={(el) => {
                if (el) el.indeterminate = somePendingChecked;
              }}
              aria-label="Tout sélectionner"
              onChange={toggleAllChecked}
            />
          ) : null,
        cell: ({ row }) =>
          row.original.status === "pending_review" ? (
            <input
              type="checkbox"
              className="h-4 w-4 accent-secondary"
              checked={checkedUserIds.has(row.original.userId)}
              aria-label="Sélectionner"
              onChange={() => toggleChecked(row.original.userId)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : null
      },
      {
        id: "creator",
        header: "Créateur",
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
        id: "followers",
        header: "Followers",
        accessorFn: (row) => row.followersTiktok + row.followersInstagram,
        cell: ({ row }) => {
          const app = row.original;
          const parts: string[] = [];
          if (app.followersTiktok > 0)
            parts.push(`TT ${app.followersTiktok.toLocaleString("fr-FR")}`);
          if (app.followersInstagram > 0)
            parts.push(`IG ${app.followersInstagram.toLocaleString("fr-FR")}`);
          return parts.length > 0 ? parts.join(" / ") : "0";
        }
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
          <StatusBadge
            label={statusLabel(row.original.status)}
            tone={statusTone(row.original.status)}
          />
        )
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter, allPendingChecked, somePendingChecked, checkedUserIds]
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

  // ── Bulk helpers ─────────────────────────────────────────────────────────
  function toggleChecked(userId: string) {
    setCheckedUserIds((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  }

  function toggleAllChecked() {
    const allIds = pendingFiltered.map((a) => a.userId);
    const allChecked = allIds.every((id) => checkedUserIds.has(id));
    setCheckedUserIds(allChecked ? new Set() : new Set(allIds));
  }

  async function submitBulkDecision(decision: Decision) {
    if (!auth.user) return;
    const ids = Array.from(checkedUserIds);
    if (ids.length === 0) return;
    if (decision === "rejected" && bulkNotes.trim().length === 0) {
      setBulkStatus({ type: "error", message: "Ajoute un message avant de refuser en masse." });
      return;
    }

    setBulkSubmitting(true);
    setBulkStatus(null);

    try {
      const results = await Promise.allSettled(
        ids.map((userId) =>
          fetch("/api/admin/applications/review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              decision,
              reviewNotes: bulkNotes.trim() || null
            })
          }).then(async (r) => {
            const payload = (await r.json()) as { application?: CreatorApplication };
            if (!r.ok || !payload.application) throw new Error("Erreur review");
            return payload.application;
          })
        )
      );

      const nextApplications = [...applications];
      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          const idx = nextApplications.findIndex((a) => a.userId === ids[i]);
          if (idx >= 0) nextApplications[idx] = result.value;
        }
      });
      setApplications(nextApplications.sort(sortApplications));

      const failures = results.filter((r) => r.status === "rejected").length;
      const successes = ids.length - failures;
      setBulkStatus({
        type: failures === 0 ? "success" : "error",
        message:
          failures === 0
            ? `${successes} candidature(s) ${decision === "approved" ? "approuvée(s)" : "refusée(s)"}.`
            : `${successes}/${ids.length} traitées — ${failures} erreur(s).`
      });

      if (failures === 0) {
        setCheckedUserIds(new Set());
        setBulkNotes("");
      }
    } catch {
      setBulkStatus({ type: "error", message: "Erreur lors du traitement en masse." });
    } finally {
      setBulkSubmitting(false);
    }
  }

  async function submitDecision(decision: Decision) {
    if (!auth.user) {
      setErrorMessage("Session manquante. Reconnecte-toi.");
      return;
    }
    if (!selected) {
      setErrorMessage("Sélection manquante.");
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
        throw new Error(
          "message" in payload && payload.message ? payload.message : "Erreur review candidature"
        );
      }

      const nextApplications = applications.map((item) =>
        item.userId === payload.application!.userId ? payload.application! : item
      );
      setApplications(nextApplications);

      if (decision === "approved") {
        setLastApproval(payload.creatorId ? { creatorId: payload.creatorId } : null);
        setStatusMessage("Candidature approuvée. Le compte peut maintenant accéder au dashboard.");
      } else {
        setStatusMessage("Candidature refusée. Le créateur verra ton feedback.");
      }

      // Keep the current application selected so admin sees the confirmation.
      // The detail panel will show the updated status badge + success message.
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
        title="Candidatures créateurs"
        subtitle="Valide les dossiers, ajoute un feedback clair, et déclenche l'accès au dashboard."
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
            onClick={() => {
              setFilter(item.key);
              const matching = applications.filter((a) => a.status === item.key);
              setSelectedUserId(matching[0]?.userId ?? null);
              setReviewNotes(matching[0]?.reviewNotes ?? "");
              setLastApproval(null);
              setStatusMessage(null);
              setErrorMessage(null);
            }}
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

      {/* ── Bulk action bar ── */}
      {checkedUserIds.size > 0 ? (
        <div className="space-y-3 rounded-[20px] border border-secondary/25 bg-secondary/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-secondary">
              {checkedUserIds.size} dossier{checkedUserIds.size > 1 ? "s" : ""} sélectionné
              {checkedUserIds.size > 1 ? "s" : ""}
            </p>
            <button
              type="button"
              className="text-xs text-foreground/50 underline underline-offset-2"
              onClick={() => { setCheckedUserIds(new Set()); setBulkStatus(null); }}
            >
              Désélectionner
            </button>
          </div>

          {/* Template chips */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/50">
              Message rapide (optionnel)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {REVIEW_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setBulkNotes(t.text)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    bulkNotes === t.text
                      ? "border-secondary bg-secondary text-white"
                      : t.tone === "approve"
                        ? "border-mint/40 bg-mint/10 text-foreground/75 hover:bg-mint/20"
                        : "border-destructive/30 bg-destructive/10 text-foreground/75 hover:bg-destructive/20"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {bulkNotes ? (
            <div className="relative rounded-xl border border-line bg-white p-3 text-sm text-foreground/75">
              {bulkNotes}
              <button
                type="button"
                onClick={() => setBulkNotes("")}
                className="absolute right-2 top-2 text-[10px] text-foreground/40 hover:text-foreground/70"
              >
                ✕
              </button>
            </div>
          ) : null}

          {bulkStatus ? (
            <p
              role="alert"
              className={cn(
                "text-sm",
                bulkStatus.type === "success" ? "text-mint" : "text-destructive"
              )}
            >
              {bulkStatus.message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="pill"
              disabled={bulkSubmitting}
              onClick={() => void submitBulkDecision("approved")}
            >
              {bulkSubmitting ? "..." : `Approuver (${checkedUserIds.size})`}
            </Button>
            <Button
              type="button"
              size="pill"
              variant="outline"
              disabled={bulkSubmitting}
              onClick={() => void submitBulkDecision("rejected")}
            >
              {bulkSubmitting ? "..." : `Refuser (${checkedUserIds.size})`}
            </Button>
          </div>
        </div>
      ) : null}

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
                    isSelected
                      ? "border-secondary/40 shadow-[0_18px_40px_-22px_rgba(8,17,66,0.55)]"
                      : undefined
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
                    <div className="flex items-start gap-2">
                      {row.status === "pending_review" ? (
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 shrink-0 accent-secondary"
                          checked={checkedUserIds.has(row.userId)}
                          aria-label="Sélectionner"
                          onChange={() => toggleChecked(row.userId)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : null}
                      <div>
                        <p className="font-semibold">{row.handle}</p>
                        <p className="text-xs text-foreground/60">{row.fullName}</p>
                      </div>
                    </div>
                    <StatusBadge label={statusLabel(row.status)} tone={statusTone(row.status)} />
                  </div>
                  <div className="grid gap-1 text-sm text-foreground/75">
                    <p>
                      {row.followersTiktok > 0
                        ? `TT ${row.followersTiktok.toLocaleString("fr-FR")}`
                        : ""}
                      {row.followersTiktok > 0 && row.followersInstagram > 0 ? " / " : ""}
                      {row.followersInstagram > 0
                        ? `IG ${row.followersInstagram.toLocaleString("fr-FR")}`
                        : ""}
                      {row.followersTiktok === 0 && row.followersInstagram === 0
                        ? "0 followers"
                        : " followers"}
                    </p>
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
          <p className="text-xs uppercase tracking-[0.15em] text-foreground/70">Détail dossier</p>

          {!selected ? (
            <p className="text-sm text-foreground/70">
              Sélectionne un dossier pour afficher les détails.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-frost/65 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-3xl uppercase leading-none">
                      {selected.handle}
                    </p>
                    <p className="text-sm text-foreground/70">{selected.fullName}</p>
                  </div>
                  <StatusBadge
                    label={statusLabel(selected.status)}
                    tone={statusTone(selected.status)}
                  />
                </div>
                <div className="mt-3 grid gap-2 text-sm text-foreground/75">
                  <p>Email: {selected.email}</p>
                  <p>WhatsApp: {selected.whatsapp}</p>
                  <p>Pays: {selected.country}</p>
                  {selected.followersTiktok > 0 ? (
                    <p>TikTok: {selected.followersTiktok.toLocaleString("fr-FR")} abonnes</p>
                  ) : null}
                  {selected.followersInstagram > 0 ? (
                    <p>Instagram: {selected.followersInstagram.toLocaleString("fr-FR")} abonnes</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.12em] text-foreground/70">Liens</p>
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
                <p className="text-xs uppercase tracking-[0.12em] text-foreground/70">
                  Notes de review (visible créateur)
                </p>

                {/* Template chips — only when still pending */}
                {selected.status === "pending_review" ? (
                  <div className="flex flex-wrap gap-1.5">
                    {REVIEW_TEMPLATES.map((t) => (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => setReviewNotes(t.text)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                          reviewNotes === t.text
                            ? "border-secondary bg-secondary text-white"
                            : t.tone === "approve"
                              ? "border-mint/40 bg-mint/10 text-foreground/75 hover:bg-mint/20"
                              : "border-destructive/30 bg-destructive/10 text-foreground/75 hover:bg-destructive/20"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                ) : null}

                <Textarea
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  placeholder="Ex: Super fit. Profil ideal pour contenus OOTD + before/after."
                  rows={4}
                  disabled={
                    submitting || selected.status === "approved" || selected.status === "rejected"
                  }
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
                  <Button
                    type="button"
                    size="pill"
                    disabled={submitting}
                    onClick={() => submitDecision("approved")}
                  >
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
                  <Link href={`/admin/creators/${lastApproval.creatorId}`}>
                    Voir la fiche créateur
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
