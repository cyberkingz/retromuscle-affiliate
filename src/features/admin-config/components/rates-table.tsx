"use client";

import { useState } from "react";
import { CardSection } from "@/components/layout/card-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfigMutation } from "@/features/admin-config/hooks/use-config-mutation";
import { formatCurrency } from "@/lib/currency";
import type { VideoRate } from "@/domain/types";

interface RatesTableProps {
  rates: Array<VideoRate & { label: string }>;
}

export function RatesTable({ rates }: RatesTableProps) {
  const [editingType, setEditingType] = useState<string | null>(null);
  const [rateValue, setRateValue] = useState(0);

  const { isPending, error, lastSuccess, mutate, reset } = useConfigMutation<{
    videoType: string;
    ratePerVideo: number;
  }>("/api/admin/config/rates");

  function startEdit(rate: VideoRate) {
    setEditingType(rate.videoType);
    setRateValue(rate.ratePerVideo);
    reset();
  }

  function cancelEdit() {
    setEditingType(null);
    reset();
  }

  async function handleSave(videoType: string) {
    const success = await mutate({ videoType, ratePerVideo: rateValue });
    if (success) setEditingType(null);
  }

  return (
    <CardSection className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.15em] text-foreground/50">Tarifs par type de video</p>
        <p className="mt-1 text-sm text-foreground/70">Prix paye au createur par video validee.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {lastSuccess && <p className="text-sm text-mint">Tarif mis a jour.</p>}

      <div className="space-y-2">
        {rates.map((rate) => {
          const isEditing = editingType === rate.videoType;

          return (
            <div
              key={rate.videoType}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-frost/50 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-semibold">{rate.label}</p>
                <p className="text-xs text-foreground/55">{rate.videoType}</p>
              </div>

              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={rateValue}
                    onChange={(e) => setRateValue(Number(e.target.value))}
                    className="w-28"
                  />
                  <Button size="sm" onClick={() => handleSave(rate.videoType)} disabled={isPending}>
                    {isPending ? "..." : "OK"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={isPending}>
                    Annuler
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="font-display text-xl uppercase text-secondary">
                    {formatCurrency(rate.ratePerVideo)}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => startEdit(rate)}>
                    Modifier
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </CardSection>
  );
}
