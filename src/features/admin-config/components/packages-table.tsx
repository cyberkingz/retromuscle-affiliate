"use client";

import { useState } from "react";
import { CardSection } from "@/components/layout/card-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfigMutation } from "@/features/admin-config/hooks/use-config-mutation";
import { formatCurrency } from "@/lib/currency";
import type { PackageDefinition } from "@/domain/types";

interface PackagesTableProps {
  packages: PackageDefinition[];
}

export function PackagesTable({ packages }: PackagesTableProps) {
  const [editingTier, setEditingTier] = useState<number | null>(null);
  const [quotaVideos, setQuotaVideos] = useState(0);
  const [monthlyCredits, setMonthlyCredits] = useState(0);

  const { isPending, error, lastSuccess, mutate, reset } = useConfigMutation<{
    tier: number;
    quotaVideos: number;
    monthlyCredits: number;
  }>("/api/admin/config/packages");

  function startEdit(pkg: PackageDefinition) {
    setEditingTier(pkg.tier);
    setQuotaVideos(pkg.quotaVideos);
    setMonthlyCredits(pkg.monthlyCredits);
    reset();
  }

  function cancelEdit() {
    setEditingTier(null);
    reset();
  }

  async function handleSave(tier: number) {
    const success = await mutate({ tier, quotaVideos, monthlyCredits });
    if (success) setEditingTier(null);
  }

  return (
    <CardSection className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-foreground/50">Packs createur</p>
          <p className="mt-1 text-sm text-foreground/70">Volume mensuel et bonus fixe par pack.</p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {lastSuccess && (
        <p className="text-sm text-mint">Pack mis a jour.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {packages.map((pkg) => {
          const isEditing = editingTier === pkg.tier;

          return (
            <div
              key={pkg.tier}
              className="rounded-2xl border border-line bg-frost/50 p-4 space-y-3"
            >
              <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">
                Pack {pkg.tier}
              </p>

              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs text-foreground/60">Videos / mois</label>
                    <Input
                      type="number"
                      min={1}
                      value={quotaVideos}
                      onChange={(e) => setQuotaVideos(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-foreground/60">Bonus fixe mensuel</label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={monthlyCredits}
                      onChange={(e) => setMonthlyCredits(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(pkg.tier)}
                      disabled={isPending}
                    >
                      {isPending ? "..." : "Sauvegarder"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={isPending}>
                      Annuler
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-display text-3xl uppercase leading-none text-secondary">
                    {pkg.quotaVideos}
                  </p>
                  <p className="text-sm text-foreground/70">videos / mois</p>
                  <p className="text-sm text-foreground/70">
                    Bonus fixe: <span className="font-medium">{formatCurrency(pkg.monthlyCredits)}</span>
                  </p>
                  <Button size="sm" variant="outline" onClick={() => startEdit(pkg)}>
                    Modifier
                  </Button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </CardSection>
  );
}
