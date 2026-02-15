"use client";

import { useState } from "react";
import { CardSection } from "@/components/layout/card-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfigMutation } from "@/features/admin-config/hooks/use-config-mutation";
import { VIDEO_TYPE_LABELS } from "@/domain/constants/labels";
import { VIDEO_TYPES, type MixDefinition, type VideoType } from "@/domain/types";

interface MixesTableProps {
  mixes: Array<MixDefinition & { label: string }>;
}

function DistributionBar({ distribution }: { distribution: Record<VideoType, number> }) {
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full">
      {VIDEO_TYPES.map((vt) => {
        const pct = (distribution[vt] ?? 0) * 100;
        if (pct === 0) return null;
        return (
          <div
            key={vt}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${pct}%`,
              backgroundColor: colorForType(vt)
            }}
            title={`${VIDEO_TYPE_LABELS[vt]}: ${pct.toFixed(0)}%`}
          />
        );
      })}
    </div>
  );
}

function colorForType(vt: VideoType): string {
  const colors: Record<VideoType, string> = {
    OOTD: "#f472b6",
    TRAINING: "#818cf8",
    BEFORE_AFTER: "#34d399",
    SPORTS_80S: "#fbbf24",
    CINEMATIC: "#f97316"
  };
  return colors[vt];
}

export function MixesTable({ mixes }: MixesTableProps) {
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editDist, setEditDist] = useState<Record<VideoType, number>>({} as Record<VideoType, number>);
  const [editPositioning, setEditPositioning] = useState("");

  const { isPending, error, lastSuccess, mutate, reset } = useConfigMutation<{
    name: string;
    distribution: Record<string, number>;
    positioning: string;
  }>("/api/admin/config/mixes");

  function startEdit(mix: MixDefinition) {
    setEditingName(mix.name);
    setEditDist({ ...mix.distribution });
    setEditPositioning(mix.positioning);
    reset();
  }

  function cancelEdit() {
    setEditingName(null);
    reset();
  }

  function updateDistValue(vt: VideoType, value: number) {
    setEditDist((prev) => ({ ...prev, [vt]: value }));
  }

  function distTotal(): number {
    return VIDEO_TYPES.reduce((sum, vt) => sum + (editDist[vt] ?? 0), 0);
  }

  async function handleSave(name: string) {
    const success = await mutate({ name, distribution: editDist, positioning: editPositioning });
    if (success) setEditingName(null);
  }

  return (
    <CardSection className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.15em] text-foreground/50">Styles de contenu (Mixes)</p>
        <p className="mt-1 text-sm text-foreground/70">
          Repartition par type de video. Les pourcentages doivent totaliser 100%.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {lastSuccess && <p className="text-sm text-mint">Style mis a jour.</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {mixes.map((mix) => {
          const isEditing = editingName === mix.name;

          return (
            <div
              key={mix.name}
              className="rounded-2xl border border-line bg-frost/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{mix.label}</p>
                  <p className="text-xs text-foreground/55">{mix.name}</p>
                </div>
                {!isEditing && (
                  <Button size="sm" variant="outline" onClick={() => startEdit(mix)}>
                    Modifier
                  </Button>
                )}
              </div>

              {isEditing ? (
                <>
                  <div className="space-y-2">
                    {VIDEO_TYPES.map((vt) => (
                      <div key={vt} className="flex items-center gap-3">
                        <span className="w-28 text-xs text-foreground/70">{VIDEO_TYPE_LABELS[vt]}</span>
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step={0.05}
                          value={editDist[vt] ?? 0}
                          onChange={(e) => updateDistValue(vt, Number(e.target.value))}
                          className="w-20"
                        />
                        <span className="text-xs text-foreground/55">
                          {((editDist[vt] ?? 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                    <p className={`text-xs font-medium ${Math.abs(distTotal() - 1) > 0.01 ? "text-destructive" : "text-mint"}`}>
                      Total: {(distTotal() * 100).toFixed(0)}%
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-foreground/60">Description</label>
                    <Input
                      value={editPositioning}
                      onChange={(e) => setEditPositioning(e.target.value)}
                      maxLength={500}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(mix.name)}
                      disabled={isPending || Math.abs(distTotal() - 1) > 0.01}
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
                  <DistributionBar distribution={mix.distribution} />
                  <div className="grid grid-cols-2 gap-1 text-xs text-foreground/70">
                    {VIDEO_TYPES.filter((vt) => mix.distribution[vt] > 0).map((vt) => (
                      <span key={vt}>
                        {VIDEO_TYPE_LABELS[vt]}: {(mix.distribution[vt] * 100).toFixed(0)}%
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-foreground/55">{mix.positioning}</p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </CardSection>
  );
}
