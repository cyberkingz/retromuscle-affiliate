"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { useAuth } from "@/features/auth/context/auth-context";
import { INITIAL_FORM, mapRecordToForm } from "@/features/apply/state";
import type {
  ApplicationFormState,
  ApplicationRecord,
  OnboardingOptions
} from "@/features/apply/types";
import { isValidEmail } from "@/lib/validation";

async function fetchOnboardingOptions(): Promise<OnboardingOptions> {
  const response = await fetch("/api/onboarding/options", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load onboarding options");
  }

  const data = (await response.json()) as {
    packages: OnboardingOptions["packages"];
    mixes: OnboardingOptions["mixes"];
  };

  return {
    packages: data.packages,
    mixes: data.mixes
  };
}

async function fetchExistingApplication(accessToken: string): Promise<ApplicationRecord | null> {
  const response = await fetch("/api/applications/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { application: ApplicationRecord | null };
  return data.application;
}

interface UseOnboardingFlowResult {
  session: Session | null;
  loadingSession: boolean;
  options: OnboardingOptions | null;
  application: ApplicationRecord | null;
  form: ApplicationFormState;
  step: number;
  stepPercent: number;
  submitting: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
  canEdit: boolean;
  setStep(step: number): void;
  updateField<K extends keyof ApplicationFormState>(
    field: K,
    value: ApplicationFormState[K]
  ): void;
  saveDraft(): Promise<void>;
  submitApplication(): Promise<void>;
  signOut(): Promise<void>;
}

function validateBeforeSubmit(form: ApplicationFormState): string | null {
  if (!form.handle.trim()) return "Ajoute ton handle createur.";
  if (!form.fullName.trim()) return "Ajoute ton nom complet.";
  if (!isValidEmail(form.email)) return "Renseigne un email valide.";
  if (!form.whatsapp.trim()) return "Ajoute ton numero WhatsApp.";
  if (!form.country.trim()) return "Ajoute ton pays.";
  if (!form.address.trim()) return "Ajoute ton adresse de livraison.";
  if (!form.socialTiktok.trim() && !form.socialInstagram.trim()) {
    return "Ajoute au moins un reseau social (TikTok ou Instagram).";
  }
  if (!form.portfolioUrl.trim()) return "Ajoute un lien portfolio.";

  const followersCount = Number(form.followers || 0);
  if (!Number.isFinite(followersCount) || followersCount < 0) {
    return "Le nombre de followers est invalide.";
  }

  return null;
}

export function useOnboardingFlow(): UseOnboardingFlowResult {
  const auth = useAuth();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [options, setOptions] = useState<OnboardingOptions | null>(null);
  const [application, setApplication] = useState<ApplicationRecord | null>(null);
  const [form, setForm] = useState<ApplicationFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let ignore = false;

    fetchOnboardingOptions()
      .then((data) => {
        if (ignore) {
          return;
        }
        setOptions(data);
        setForm((current) => ({
          ...current,
          packageTier: current.packageTier || data.packages[0]?.tier || 20,
          mixName: current.mixName || data.mixes[0]?.name || "VOLUME"
        }));
      })
      .catch((error) => {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : "Erreur chargement options");
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!auth.session) {
      return;
    }

    let ignore = false;

    fetchExistingApplication(auth.session.access_token)
      .then((record) => {
        if (ignore || !record) {
          return;
        }

        setApplication(record);
        setForm(mapRecordToForm(record));
      })
      .catch(() => {
        // Ignore initial fetch issues and let user continue with a blank form.
      });

    return () => {
      ignore = true;
    };
  }, [auth.session]);

  const canEdit = application?.status !== "pending_review" && application?.status !== "approved";
  const stepPercent = useMemo(() => ((step + 1) / 3) * 100, [step]);

  function updateField<K extends keyof ApplicationFormState>(
    field: K,
    value: ApplicationFormState[K]
  ): void {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function setSafeStep(nextStep: number) {
    setStep(Math.max(0, Math.min(2, nextStep)));
  }

  async function persistApplication(submit: boolean) {
    if (!auth.session) {
      return;
    }

    if (submit) {
      const validationMessage = validateBeforeSubmit(form);
      if (validationMessage) {
        setErrorMessage(validationMessage);
        setStatusMessage(null);
        return;
      }
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/applications/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.session.access_token}`
        },
        body: JSON.stringify({
          handle: form.handle,
          fullName: form.fullName,
          email: form.email,
          whatsapp: form.whatsapp,
          country: form.country,
          address: form.address,
          socialTiktok: form.socialTiktok,
          socialInstagram: form.socialInstagram,
          followers: Number(form.followers || 0),
          portfolioUrl: form.portfolioUrl,
          packageTier: Number(form.packageTier),
          mixName: form.mixName,
          submit
        })
      });

      const data = (await response.json()) as {
        application?: ApplicationRecord;
        message?: string;
      };

      if (!response.ok || !data.application) {
        throw new Error(data.message ?? "Erreur sauvegarde dossier");
      }

      setApplication(data.application);
      setStatusMessage(
        submit
          ? "Dossier soumis. Tu recevras un retour apres revue de l'equipe."
          : "Brouillon sauvegarde."
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erreur sauvegarde dossier");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveDraft() {
    await persistApplication(false);
  }

  async function submitApplication() {
    await persistApplication(true);
  }

  async function signOut() {
    await auth.signOut();
    setApplication(null);
    setForm(INITIAL_FORM);
    setStep(0);
  }

  return {
    session: auth.session as Session | null,
    loadingSession: auth.loading,
    options,
    application,
    form,
    step,
    stepPercent,
    submitting,
    statusMessage,
    errorMessage: errorMessage ?? auth.error,
    canEdit,
    setStep: setSafeStep,
    updateField,
    saveDraft,
    submitApplication,
    signOut
  };
}
