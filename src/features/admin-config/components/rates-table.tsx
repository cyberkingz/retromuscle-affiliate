"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { CardSection } from "@/components/layout/card-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useConfigMutation } from "@/features/admin-config/hooks/use-config-mutation";
import { formatCurrency } from "@/lib/currency";
import type { VideoRate } from "@/domain/types";

interface RatesTableProps {
  rates: Array<VideoRate & { label: string }>;
}

type RateRow = VideoRate & { label: string };

export function RatesTable({ rates }: RatesTableProps) {
  const [editingType, setEditingType] = useState<string | null>(null);
  const [rateValue, setRateValue] = useState(0);
  const [disableTarget, setDisableTarget] = useState<RateRow | null>(null);
  const [confirmEditTarget, setConfirmEditTarget] = useState<RateRow | null>(null);

  const updateMutation = useConfigMutation<{
    videoType: string;
    ratePerVideo: number;
  }>("/api/admin/config/rates");

  const deleteMutation = useConfigMutation<{
    videoType: string;
  }>("/api/admin/config/rates", "DELETE");

  const activeRatesCount = rates.filter((rate) => !rate.isPlaceholder).length;
  const isPending = updateMutation.isPending || deleteMutation.isPending;
  const error = updateMutation.error ?? deleteMutation.error;

  function requestEdit(rate: RateRow) {
    setConfirmEditTarget(rate);
    updateMutation.reset();
    deleteMutation.reset();
  }

  function confirmEdit() {
    if (!confirmEditTarget) return;
    setEditingType(confirmEditTarget.videoType);
    setRateValue(confirmEditTarget.ratePerVideo);
    setConfirmEditTarget(null);
  }

  function startEdit(rate: VideoRate) {
    setEditingType(rate.videoType);
    setRateValue(rate.ratePerVideo);
    updateMutation.reset();
    deleteMutation.reset();
  }

  function cancelEdit() {
    setEditingType(null);
    updateMutation.reset();
    deleteMutation.reset();
  }

  async function handleSave(videoType: string) {
    const success = await updateMutation.mutate({ videoType, ratePerVideo: rateValue });
    if (success) setEditingType(null);
  }

  function requestDisable(rate: RateRow) {
    if (rate.isPlaceholder || activeRatesCount <= 1) return;
    updateMutation.reset();
    deleteMutation.reset();
    setDisableTarget(rate);
  }

  async function confirmDisable() {
    if (!disableTarget) return;

    const targetType = disableTarget.videoType;
    const success = await deleteMutation.mutate({ videoType: targetType });
    if (success && editingType === targetType) {
      setEditingType(null);
    }
    if (success) setDisableTarget(null);
  }

  async function handleEnable(rate: VideoRate) {
    if (!rate.isPlaceholder) return;
    const success = await updateMutation.mutate({
      videoType: rate.videoType,
      ratePerVideo: rate.ratePerVideo
    });
    if (success && editingType === rate.videoType) {
      setEditingType(null);
    }
  }

  return (
    <CardSection className="space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.15em] text-foreground/75">
          Tarifs par type de vidéo
        </p>
        <p className="mt-1 text-sm text-foreground/70">Prix payé au créateur par vidéo validée.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {updateMutation.lastSuccess && <p className="text-sm text-mint">Tarif mis à jour.</p>}
      {deleteMutation.lastSuccess && <p className="text-sm text-mint">Produit désactivé.</p>}

      <div className="space-y-1.5">
        <div className="hidden grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-3 pb-1 text-[11px] uppercase tracking-[0.11em] text-foreground/65 sm:grid">
          <span>Produit</span>
          <span className="justify-self-end">Prix</span>
          <span className="justify-self-end">Actions</span>
        </div>

        {rates.map((rate) => {
          const isEditing = editingType === rate.videoType;
          const disableBlocked = !rate.isPlaceholder && activeRatesCount <= 1;

          return (
            <div
              key={rate.videoType}
              className="grid grid-cols-1 gap-2 rounded-xl border border-line bg-frost/45 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold leading-tight">{rate.label}</p>
                  {rate.isPlaceholder ? (
                    <p className="inline-flex rounded-full border border-amber-400/50 bg-amber-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.07em] text-amber-800">
                      Off
                    </p>
                  ) : null}
                </div>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-foreground/65">
                  {rate.videoType}
                </p>
              </div>

              {isEditing ? (
                <>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={rateValue}
                    onChange={(e) => setRateValue(Number(e.target.value))}
                    className="h-8 w-24 rounded-lg px-2.5 text-sm sm:justify-self-end"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => handleSave(rate.videoType)}
                      disabled={isPending}
                      className="h-8 rounded-md px-2.5 text-[10px] tracking-[0.06em]"
                    >
                      {isPending ? "..." : "OK"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelEdit}
                      disabled={isPending}
                      className="h-8 rounded-md px-2.5 text-[10px] tracking-[0.06em]"
                    >
                      Annul.
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-display text-lg uppercase leading-none text-secondary sm:justify-self-end">
                    {formatCurrency(rate.ratePerVideo)}
                  </p>
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => requestEdit(rate)}
                      disabled={isPending}
                      className="h-8 rounded-md px-2.5 text-[10px] tracking-[0.06em]"
                    >
                      Modif.
                    </Button>
                    {rate.isPlaceholder ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEnable(rate)}
                        disabled={isPending}
                        className="h-8 rounded-md px-2.5 text-[10px] tracking-[0.06em]"
                      >
                        On
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => requestDisable(rate)}
                        disabled={isPending || disableBlocked}
                        title={
                          disableBlocked ? "Au moins un produit doit rester actif." : undefined
                        }
                        className="h-8 rounded-md px-2.5 text-[10px] tracking-[0.06em]"
                      >
                        Off
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <Dialog
        open={Boolean(confirmEditTarget)}
        onOpenChange={(open) => {
          if (!open) setConfirmEditTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              Modifier ce tarif ?
            </DialogTitle>
            <DialogDescription>
              Ce changement s&apos;appliquera aux calculs de paiements futurs et aux mois non encore
              payés. Les mois déjà payés conservent leur montant figé.
            </DialogDescription>
          </DialogHeader>

          {confirmEditTarget ? (
            <div className="space-y-4 px-6 pb-6">
              <div className="rounded-xl border border-line bg-frost/60 px-4 py-3">
                <p className="font-semibold leading-tight">{confirmEditTarget.label}</p>
                <p className="mt-2 font-display text-lg uppercase leading-none text-secondary">
                  Tarif actuel : {formatCurrency(confirmEditTarget.ratePerVideo)}
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-md px-3 text-[11px] tracking-[0.06em]"
                  onClick={() => setConfirmEditTarget(null)}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 rounded-md px-3 text-[11px] tracking-[0.06em]"
                  onClick={confirmEdit}
                >
                  Modifier le tarif
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(disableTarget)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDisableTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmer la désactivation
            </DialogTitle>
            <DialogDescription>
              Ce type ne sera plus disponible pour les nouveaux uploads créateur.
            </DialogDescription>
          </DialogHeader>

          {disableTarget ? (
            <div className="space-y-4 px-6 pb-6">
              <div className="rounded-xl border border-line bg-frost/60 px-4 py-3">
                <p className="font-semibold leading-tight">{disableTarget.label}</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-foreground/65">
                  {disableTarget.videoType}
                </p>
                <p className="mt-2 font-display text-lg uppercase leading-none text-secondary">
                  {formatCurrency(disableTarget.ratePerVideo)}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-md px-3 text-[11px] tracking-[0.06em]"
                  onClick={() => setDisableTarget(null)}
                  disabled={deleteMutation.isPending}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-8 rounded-md px-3 text-[11px] tracking-[0.06em]"
                  onClick={() => void confirmDisable()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "..." : "Désactiver"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </CardSection>
  );
}
