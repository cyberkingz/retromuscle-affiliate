"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

// ---------------------------------------------------------------------------
// Supabase draft persistence helpers
// ---------------------------------------------------------------------------
const SAVE_DEBOUNCE_MS = 1_200;

async function fetchDraft(): Promise<{ form: ApplicationFormState; step: number } | null> {
  try {
    const response = await fetch("/api/applications/draft", { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      draft: { form_data: ApplicationFormState; step: number } | null;
    };
    if (!data.draft?.form_data) return null;
    const fd = data.draft.form_data;
    // Validate the shape before trusting it.
    if (typeof fd.fullName !== "string" || typeof fd.whatsapp !== "string") return null;
    return {
      form: {
        fullName: fd.fullName ?? "",
        whatsapp: fd.whatsapp ?? "",
        country: fd.country ?? "",
        address: fd.address ?? "",
        socialTiktok: fd.socialTiktok ?? "",
        socialInstagram: fd.socialInstagram ?? "",
        followers: fd.followers ?? "",
        packageTier: fd.packageTier ?? 20,
        mixName: fd.mixName ?? "VOLUME"
      },
      step: Math.max(0, Math.min(2, data.draft.step ?? 0))
    };
  } catch {
    return null;
  }
}

async function saveDraftToServer(form: ApplicationFormState, step: number): Promise<boolean> {
  try {
    const response = await fetch("/api/applications/draft", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData: form, step })
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function deleteDraftFromServer(): Promise<void> {
  try {
    await fetch("/api/applications/draft", { method: "DELETE" });
  } catch {
    // Ignore delete failures.
  }
}

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
  submittingTooLong: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
  canEdit: boolean;
  setStep(step: number): void;
  updateField<K extends keyof ApplicationFormState>(
    field: K,
    value: ApplicationFormState[K]
  ): void;
  draftSaved: boolean;
  draftRestored: boolean;
  errorField: keyof ApplicationFormState | null;
  validateStep(step: number): boolean;
  validateField(field: keyof ApplicationFormState): void;
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
  const [submittingTooLong, setSubmittingTooLong] = useState(false);
  const submittingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [step, setStep] = useState(0);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Auto-dismiss "Brouillon restaure" after 4 seconds.
  const draftRestoredTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (draftRestored) {
      draftRestoredTimerRef.current = setTimeout(() => setDraftRestored(false), 4_000);
      return () => {
        if (draftRestoredTimerRef.current) clearTimeout(draftRestoredTimerRef.current);
      };
    }
  }, [draftRestored]);

  // Track whether the initial Supabase draft load has completed to avoid
  // saving back INITIAL_FORM before we've loaded the actual draft.
  const draftLoadedRef = useRef(false);

  // Debounced Supabase draft save whenever form or step changes.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftSavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveDraft = useCallback((nextForm: ApplicationFormState, nextStep: number) => {
    if (!draftLoadedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void saveDraftToServer(nextForm, nextStep).then((ok) => {
        if (ok) {
          setDraftSaved(true);
          if (draftSavedTimerRef.current) clearTimeout(draftSavedTimerRef.current);
          draftSavedTimerRef.current = setTimeout(() => setDraftSaved(false), 1500);
        }
      });
    }, SAVE_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    saveDraft(form, step);
  }, [form, step, saveDraft]);

  // Cleanup debounce timers on unmount.
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (draftSavedTimerRef.current) clearTimeout(draftSavedTimerRef.current);
    };
  }, []);

  // Warn user before leaving page with unsaved form data.
  const formRef = useRef(form);
  formRef.current = form;
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      const f = formRef.current;
      const hasContent = f.fullName.trim() || f.whatsapp.trim() || f.socialTiktok.trim() || f.socialInstagram.trim();
      if (hasContent) {
        event.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

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

  // Load existing application or draft from Supabase when user authenticates.
  useEffect(() => {
    if (!auth.user) {
      return;
    }

    let ignore = false;

    (async () => {
      // First try to load an existing submitted application.
      const record = await fetchExistingApplication().catch(() => null);
      if (ignore) return;

      if (record) {
        setApplication(record);
        setForm(mapRecordToForm(record));
        draftLoadedRef.current = true;
        return;
      }

      // No submitted application -- try to restore draft from Supabase.
      const draft = await fetchDraft();
      if (ignore) return;

      if (draft) {
        setForm(draft.form);
        setStep(draft.step);
        setDraftRestored(true);
      }
      draftLoadedRef.current = true;
    })();

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
    if (draftRestored) setDraftRestored(false);
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

  function validateField(field: keyof ApplicationFormState) {
    // Run the validation for the current step to check this specific field.
    const result = validateWizardStep(step, form);
    if (!result.ok && result.field === field) {
      setErrorMessage(result.message);
      setFocusField(result.field);
    } else if (focusField === field) {
      // Clear error if the field that was previously errored is now valid.
      setErrorMessage(null);
      setFocusField(null);
    }
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
    setSubmittingTooLong(false);
    if (submittingTimerRef.current) clearTimeout(submittingTimerRef.current);
    submittingTimerRef.current = setTimeout(() => setSubmittingTooLong(true), 10_000);

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
      void deleteDraftFromServer();
      setStatusMessage("Dossier soumis. Tu recevras un retour apres revue de l'equipe.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erreur sauvegarde dossier");
    } finally {
      if (submittingTimerRef.current) clearTimeout(submittingTimerRef.current);
      setSubmitting(false);
      setSubmittingTooLong(false);
    }
  }

  async function submitApplication() {
    await persistApplication();
  }

  async function signOut() {
    await auth.signOut();
    void deleteDraftFromServer();
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
    submittingTooLong,
    statusMessage,
    errorMessage: errorMessage ?? auth.error,
    canEdit,
    draftSaved,
    draftRestored,
    errorField: focusField,
    setStep: setSafeStep,
    updateField,
    validateStep,
    validateField,
    clearFocusField,
    submitApplication,
    signOut
  };
}
