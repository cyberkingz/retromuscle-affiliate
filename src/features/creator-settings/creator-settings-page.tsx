"use client";

import { useMemo, useState } from "react";

import type { CreatorSettingsData } from "@/application/use-cases/get-creator-settings-data";
import { CardSection } from "@/components/layout/card-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { isValidEmail } from "@/lib/validation";

type PayoutMethod = NonNullable<CreatorSettingsData["payoutProfile"]>["method"];

function normalizeIban(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

function isLikelyIban(value: string): boolean {
  const iban = normalizeIban(value);
  // Lightweight sanity check; full checksum validation is out-of-scope here.
  return /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban) && iban.length >= 15 && iban.length <= 34;
}

function maskLast4(value?: string | null): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  return trimmed.slice(-4);
}

interface CreatorSettingsPageProps {
  data: CreatorSettingsData;
}

export function CreatorSettingsPage({ data }: CreatorSettingsPageProps) {
  const existing = data.payoutProfile;

  const [method, setMethod] = useState<PayoutMethod>(existing?.method ?? "iban");
  const [accountHolderName, setAccountHolderName] = useState(existing?.accountHolderName ?? "");
  const [iban, setIban] = useState("");
  const [paypalEmail, setPaypalEmail] = useState(existing?.paypalEmail ?? "");
  const [stripeAccount, setStripeAccount] = useState(existing?.stripeAccount ?? "");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const existingIbanLast4 = useMemo(() => maskLast4(existing?.ibanLast4), [existing?.ibanLast4]);

  const requiresIban = method === "iban";
  const requiresPaypal = method === "paypal";
  const requiresStripe = method === "stripe";

  async function savePayoutProfile() {
    setSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      if (requiresIban) {
        if (accountHolderName.trim().length < 2) {
          throw new Error("Renseigne le nom du titulaire du compte.");
        }

        // Allow leaving IBAN empty if one is already on file (creator might only change the holder name).
        if (!existingIbanLast4 && !iban.trim()) {
          throw new Error("Renseigne ton IBAN (format international).");
        }

        if (iban.trim() && !isLikelyIban(iban)) {
          throw new Error("IBAN invalide. Exemple: FR76 3000 6000 0112 3456 7890 189");
        }
      }

      if (requiresPaypal) {
        if (!isValidEmail(paypalEmail.trim())) {
          throw new Error("Renseigne un email PayPal valide.");
        }
      }

      if (requiresStripe) {
        if (!stripeAccount.trim()) {
          throw new Error("Renseigne ton identifiant Stripe (ou laisse vide et contacte le support).");
        }
      }

      const response = await fetch("/api/creator/payout-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          method,
          accountHolderName: accountHolderName.trim() || null,
          iban: requiresIban && iban.trim() ? normalizeIban(iban) : null,
          paypalEmail: requiresPaypal ? paypalEmail.trim().toLowerCase() : null,
          stripeAccount: requiresStripe ? stripeAccount.trim() : null
        })
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Impossible d'enregistrer tes informations.");
      }

      setIban("");
      setStatusMessage("Informations de paiement enregistrees.");
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Impossible d'enregistrer tes informations.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Settings"
        title="Parametres du compte"
        subtitle="Mets a jour tes informations de paiement pour recevoir tes virements."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <CardSection>
          <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Profil</p>
          <div className="mt-4 space-y-2 text-sm text-foreground/80">
            <p>
              <span className="text-foreground/55">Handle:</span>{" "}
              <span className="font-semibold">{data.creator.handle}</span>
            </p>
            <p>
              <span className="text-foreground/55">Nom:</span>{" "}
              <span className="font-semibold">{data.creator.displayName}</span>
            </p>
            <p>
              <span className="text-foreground/55">Email:</span>{" "}
              <span className="font-semibold">{data.creator.email}</span>
            </p>
            <p>
              <span className="text-foreground/55">Pays:</span>{" "}
              <span className="font-semibold">{data.creator.country}</span>
            </p>
          </div>
          <p className="mt-4 text-xs text-foreground/60">
            Pour modifier ton profil, contacte le support (edition self-serve a venir).
          </p>
        </CardSection>

        <CardSection>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Paiement</p>
              <p className="mt-2 text-sm text-foreground/75">
                Renseigne tes coordonnees pour recevoir tes paiements mensuels.
              </p>
            </div>
            {existing ? (
              <div className="rounded-full border border-line bg-frost/70 px-3 py-1 text-xs text-foreground/70">
                Mis a jour {new Date(existing.updatedAt).toLocaleDateString("fr-FR")}
              </div>
            ) : null}
          </div>

          <div className="mt-5 space-y-4">
            <label className="block space-y-2 text-sm">
              <span className="font-medium">Methode</span>
              <select
                value={method}
                onChange={(event) => {
                  setMethod(event.target.value as PayoutMethod);
                  setStatusMessage(null);
                  setErrorMessage(null);
                }}
                className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm"
              >
                <option value="iban">Virement bancaire (IBAN)</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe (placeholder)</option>
              </select>
            </label>

            {requiresIban ? (
              <div className="space-y-3 rounded-2xl border border-line bg-frost/60 p-4">
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">Titulaire du compte</span>
                  <Input
                    value={accountHolderName}
                    onChange={(event) => setAccountHolderName(event.target.value)}
                    placeholder="Prenom Nom"
                    autoComplete="name"
                  />
                </label>

                <label className="block space-y-2 text-sm">
                  <span className="font-medium">IBAN</span>
                  <Input
                    value={iban}
                    onChange={(event) => setIban(event.target.value)}
                    placeholder={existingIbanLast4 ? `IBAN deja enregistre (fin ${existingIbanLast4})` : "FR76 3000 6000 0112 3456 7890 189"}
                    autoComplete="off"
                  />
                  <p className="text-xs text-foreground/60">
                    {existingIbanLast4
                      ? "Pour changer ton IBAN, renseigne le nouveau puis enregistre."
                      : "Ton IBAN est utilise uniquement pour les virements."}
                  </p>
                </label>
              </div>
            ) : null}

            {requiresPaypal ? (
              <div className="space-y-3 rounded-2xl border border-line bg-frost/60 p-4">
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">Email PayPal</span>
                  <Input
                    value={paypalEmail}
                    onChange={(event) => setPaypalEmail(event.target.value)}
                    placeholder="paypal@email.com"
                    autoComplete="email"
                  />
                </label>
              </div>
            ) : null}

            {requiresStripe ? (
              <div className="space-y-3 rounded-2xl border border-line bg-frost/60 p-4">
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">Stripe account</span>
                  <Input
                    value={stripeAccount}
                    onChange={(event) => setStripeAccount(event.target.value)}
                    placeholder="acct_..."
                    autoComplete="off"
                  />
                  <p className="text-xs text-foreground/60">
                    Optionnel pour l&apos;instant. Si tu n&apos;as pas de compte, contacte le support.
                  </p>
                </label>
              </div>
            ) : null}

            {errorMessage ? (
              <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
            ) : null}
            {statusMessage ? (
              <p className="rounded-2xl border border-mint/25 bg-mint/10 px-4 py-3 text-sm text-foreground/80">
                {statusMessage}
              </p>
            ) : null}

            <Button type="button" size="pill" onClick={() => void savePayoutProfile()} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>

            <p className="text-xs text-foreground/60">
              Besoin d&apos;aide ? Ecris-nous, on peut verifier tes infos de paiement.
            </p>
          </div>
        </CardSection>
      </div>
    </div>
  );
}
