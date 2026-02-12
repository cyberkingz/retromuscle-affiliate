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

function formatIbanPreview(value: string): string {
  const clean = normalizeIban(value);
  return clean.replace(/(.{4})/g, "$1 ").trim();
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const existingIbanLast4 = useMemo(() => maskLast4(existing?.ibanLast4), [existing?.ibanLast4]);

  const requiresIban = method === "iban";
  const requiresPaypal = method === "paypal";
  const requiresStripe = method === "stripe";

  // Inline validation states
  const ibanTrimmed = iban.trim();
  const ibanValid = !ibanTrimmed || isLikelyIban(ibanTrimmed);
  const ibanFormatted = ibanTrimmed ? formatIbanPreview(ibanTrimmed) : "";
  const holderNameValid = accountHolderName.trim().length >= 2;
  const paypalEmailValid = !paypalEmail.trim() || isValidEmail(paypalEmail.trim());

  function markTouched(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function savePayoutProfile() {
    setSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);
    setTouched({ accountHolderName: true, iban: true, paypalEmail: true, stripeAccount: true });

    try {
      if (requiresIban) {
        if (!holderNameValid) {
          throw new Error("Renseigne le nom du titulaire du compte (min. 2 caracteres).");
        }

        // Allow leaving IBAN empty if one is already on file (creator might only change the holder name).
        if (!existingIbanLast4 && !ibanTrimmed) {
          throw new Error("Renseigne ton IBAN (format international).");
        }

        if (ibanTrimmed && !isLikelyIban(ibanTrimmed)) {
          throw new Error("IBAN invalide. Verifie le format. Exemple: FR76 3000 6000 0112 3456 7890 189");
        }
      }

      if (requiresPaypal) {
        if (!isValidEmail(paypalEmail.trim())) {
          throw new Error("Renseigne un email PayPal valide (ex: prenom@email.com).");
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
          iban: requiresIban && ibanTrimmed ? normalizeIban(ibanTrimmed) : null,
          paypalEmail: requiresPaypal ? paypalEmail.trim().toLowerCase() : null,
          stripeAccount: requiresStripe ? stripeAccount.trim() : null
        })
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Impossible d'enregistrer tes informations.");
      }

      setIban("");
      setTouched({});
      setStatusMessage("Informations de paiement enregistrees avec succes. Tes prochains paiements utiliseront ces coordonnees.");
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Impossible d'enregistrer tes informations.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Parametres"
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
              <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Informations de paiement</p>
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
              <span className="font-medium">
                Methode de paiement <span className="text-destructive">*</span>
              </span>
              <select
                value={method}
                onChange={(event) => {
                  setMethod(event.target.value as PayoutMethod);
                  setStatusMessage(null);
                  setErrorMessage(null);
                  setTouched({});
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
                  <span className="font-medium">
                    Titulaire du compte <span className="text-destructive">*</span>
                  </span>
                  <Input
                    value={accountHolderName}
                    onChange={(event) => setAccountHolderName(event.target.value)}
                    onBlur={() => markTouched("accountHolderName")}
                    placeholder="Prenom Nom"
                    autoComplete="name"
                    className={
                      touched.accountHolderName && !holderNameValid
                        ? "border-destructive/50 focus:border-destructive"
                        : undefined
                    }
                  />
                  {touched.accountHolderName && !holderNameValid ? (
                    <p className="text-xs text-destructive">
                      Le nom du titulaire est requis (min. 2 caracteres).
                    </p>
                  ) : null}
                </label>

                <label className="block space-y-2 text-sm">
                  <span className="font-medium">
                    IBAN {!existingIbanLast4 ? <span className="text-destructive">*</span> : null}
                  </span>
                  <Input
                    value={iban}
                    onChange={(event) => setIban(event.target.value)}
                    onBlur={() => markTouched("iban")}
                    placeholder={existingIbanLast4 ? `IBAN deja enregistre (fin ${existingIbanLast4})` : "FR76 3000 6000 0112 3456 7890 189"}
                    autoComplete="off"
                    className={
                      touched.iban && ibanTrimmed && !ibanValid
                        ? "border-destructive/50 focus:border-destructive"
                        : undefined
                    }
                  />
                  {ibanTrimmed && ibanValid ? (
                    <p className="text-xs text-mint">
                      Format valide: {ibanFormatted}
                    </p>
                  ) : null}
                  {touched.iban && ibanTrimmed && !ibanValid ? (
                    <p className="text-xs text-destructive">
                      Format IBAN invalide. Verifie le code pays (2 lettres), la cle (2 chiffres), puis le numero de compte. Exemple: FR76 3000 6000 0112 3456 7890 189
                    </p>
                  ) : null}
                  {!ibanTrimmed ? (
                    <p className="text-xs text-foreground/60">
                      {existingIbanLast4
                        ? "Pour changer ton IBAN, renseigne le nouveau puis enregistre."
                        : "Ton IBAN est utilise uniquement pour les virements. Format: code pays + cle + numero de compte."}
                    </p>
                  ) : null}
                </label>
              </div>
            ) : null}

            {requiresPaypal ? (
              <div className="space-y-3 rounded-2xl border border-line bg-frost/60 p-4">
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">
                    Email PayPal <span className="text-destructive">*</span>
                  </span>
                  <Input
                    value={paypalEmail}
                    onChange={(event) => setPaypalEmail(event.target.value)}
                    onBlur={() => markTouched("paypalEmail")}
                    placeholder="paypal@email.com"
                    autoComplete="email"
                    className={
                      touched.paypalEmail && paypalEmail.trim() && !paypalEmailValid
                        ? "border-destructive/50 focus:border-destructive"
                        : undefined
                    }
                  />
                  {touched.paypalEmail && paypalEmail.trim() && !paypalEmailValid ? (
                    <p className="text-xs text-destructive">
                      Adresse email invalide. Verifie le format (ex: prenom@email.com).
                    </p>
                  ) : null}
                  {paypalEmail.trim() && paypalEmailValid ? (
                    <p className="text-xs text-mint">
                      Format email valide.
                    </p>
                  ) : null}
                </label>
              </div>
            ) : null}

            {requiresStripe ? (
              <div className="space-y-3 rounded-2xl border border-line bg-frost/60 p-4">
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">
                    Identifiant Stripe <span className="text-destructive">*</span>
                  </span>
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
              <div className="rounded-2xl border border-mint/25 bg-mint/10 px-4 py-3" role="status">
                <p className="text-sm font-medium text-foreground/80">{statusMessage}</p>
              </div>
            ) : null}

            <Button type="button" size="pill" onClick={() => void savePayoutProfile()} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer les informations"}
            </Button>

            <p className="text-xs text-foreground/60">
              Les champs marques d&apos;un <span className="text-destructive">*</span> sont obligatoires. Besoin d&apos;aide ? Ecris-nous, on peut verifier tes infos de paiement.
            </p>
          </div>
        </CardSection>
      </div>
    </div>
  );
}
