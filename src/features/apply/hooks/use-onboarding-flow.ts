"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/features/auth/context/auth-context";
import { INITIAL_FORM, mapRecordToForm } from "@/features/apply/state";
import type {
  ApplicationFormState,
  ApplicationRecord,
  OnboardingOptions
} from "@/features/apply/types";
import {
  isValidInstagramUrl,
  isValidTiktokUrl,
  normalizeHttpUrl
} from "@/lib/validation";

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

async function fetchExistingApplication(): Promise<ApplicationRecord | null> {
  const response = await fetch("/api/applications/me", {
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { application: ApplicationRecord | null };
  return data.application;
}

interface UseOnboardingFlowResult {
  user: { id: string; email: string | null } | null;
  loadingSession: boolean;
  options: OnboardingOptions | null;
  application: ApplicationRecord | null;
  form: ApplicationFormState;
  focusField: keyof ApplicationFormState | null;
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
  validateStep(step: number): boolean;
  clearFocusField(): void;
  submitApplication(): Promise<void>;
  signOut(): Promise<void>;
}

type StepValidationResult =
  | { ok: true }
  | { ok: false; field: keyof ApplicationFormState; message: string };

function fail(field: keyof ApplicationFormState, message: string): StepValidationResult {
  return { ok: false, field, message };
}

function normalizeDigits(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function parseFollowers(value: string): number | null {
  const digits = normalizeDigits(value.trim());
  if (!digits) return null;
  const parsed = Number(digits);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0 || parsed > 100000000) {
    return null;
  }
  return parsed;
}

function validateStep0(form: ApplicationFormState): StepValidationResult {
  if (!form.fullName.trim()) return fail("fullName", "Ajoute ton nom complet.");
  if (!form.whatsapp.trim()) return fail("whatsapp", "Ajoute ton numero WhatsApp.");
  if (!form.country.trim()) return fail("country", "Ajoute ton pays.");
  if (!form.address.trim()) return fail("address", "Ajoute ton adresse de livraison.");
  return { ok: true };
}

function validateStep1(form: ApplicationFormState): StepValidationResult {
  const tiktok = form.socialTiktok.trim();
  const instagram = form.socialInstagram.trim();

  if (!tiktok && !instagram) {
    return fail("socialTiktok", "Ajoute au moins un reseau social (TikTok ou Instagram).");
  }
  if (tiktok && !isValidTiktokUrl(tiktok)) {
    return fail("socialTiktok", "Lien TikTok invalide. Exemple: https://www.tiktok.com/@toncompte");
  }
  if (instagram && !isValidInstagramUrl(instagram)) {
    return fail("socialInstagram", "Lien Instagram invalide. Exemple: https://www.instagram.com/toncompte");
  }

  const followers = parseFollowers(form.followers);
  if (followers === null) {
    return fail("followers", "Le nombre de followers est invalide.");
  }

  return { ok: true };
}

function validateStep2(form: ApplicationFormState): StepValidationResult {
  if (!form.packageTier) return fail("packageTier", "Choisis un package valide.");
  if (!form.mixName) return fail("mixName", "Choisis un mix valide.");
  return { ok: true };
}

function validateWizardStep(step: number, form: ApplicationFormState): StepValidationResult {
  if (step === 0) return validateStep0(form);
  if (step === 1) return validateStep1(form);
  return validateStep2(form);
}

function validateBeforeSubmit(form: ApplicationFormState): StepValidationResult {
  const first = validateStep0(form);
  if (!first.ok) return first;
  const second = validateStep1(form);
  if (!second.ok) return second;
  return validateStep2(form);
}

export function useOnboardingFlow(): UseOnboardingFlowResult {
  const auth = useAuth();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<keyof ApplicationFormState | null>(null);

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
    if (!auth.user) {
      return;
    }

    let ignore = false;

    fetchExistingApplication()
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
  }, [auth.user]);

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

  function validateStep(currentStep: number): boolean {
    const result = validateWizardStep(currentStep, form);
    if (result.ok) {
      setErrorMessage(null);
      return true;
    }

    setErrorMessage(result.message);
    setStatusMessage(null);
    setFocusField(result.field);
    return false;
  }

  function clearFocusField() {
    setFocusField(null);
  }

  async function persistApplication() {
    if (!auth.user) {
      return;
    }

    const validation = validateBeforeSubmit(form);
    if (!validation.ok) {
      setErrorMessage(validation.message);
      setStatusMessage(null);
      setFocusField(validation.field);
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setSubmitting(true);

    try {
      const followers = parseFollowers(form.followers);
      if (followers === null) {
        throw new Error("Le nombre de followers est invalide.");
      }

      const response = await fetch("/api/applications/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: form.fullName,
          whatsapp: form.whatsapp,
          country: form.country,
          address: form.address,
          socialTiktok: form.socialTiktok ? normalizeHttpUrl(form.socialTiktok) : "",
          socialInstagram: form.socialInstagram ? normalizeHttpUrl(form.socialInstagram) : "",
          followers,
          packageTier: Number(form.packageTier),
          mixName: form.mixName,
          submit: true
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
      setStatusMessage("Dossier soumis. Tu recevras un retour apres revue de l'equipe.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erreur sauvegarde dossier");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitApplication() {
    await persistApplication();
  }

  async function signOut() {
    await auth.signOut();
    setApplication(null);
    setForm(INITIAL_FORM);
    setStep(0);
  }

  return {
    user: auth.user,
    loadingSession: auth.loading,
    options,
    application,
    form,
    focusField,
    step,
    stepPercent,
    submitting,
    statusMessage,
    errorMessage: errorMessage ?? auth.error,
    canEdit,
    setStep: setSafeStep,
    updateField,
    validateStep,
    clearFocusField,
    submitApplication,
    signOut
  };
}
