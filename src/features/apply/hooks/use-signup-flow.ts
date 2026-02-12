"use client";

import { useState } from "react";

import { useAuth } from "@/features/auth/context/auth-context";
import { isValidEmail } from "@/lib/validation";

interface UseSignupFlowResult {
  user: { id: string; email: string | null } | null;
  loadingSession: boolean;
  mode: "signup" | "signin";
  email: string;
  password: string;
  confirmPassword: string;
  submitting: boolean;
  needsEmailConfirmation: boolean;
  resending: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
  setMode(value: "signup" | "signin"): void;
  setEmail(value: string): void;
  setPassword(value: string): void;
  setConfirmPassword(value: string): void;
  submitCredentials(): Promise<void>;
  resendVerificationEmail(): Promise<void>;
  signOut(): Promise<void>;
}

export function useSignupFlow(initialMode: "signup" | "signin" = "signup"): UseSignupFlowResult {
  const auth = useAuth();
  const [mode, setModeState] = useState<"signup" | "signin">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submitCredentials() {
    setErrorMessage(null);
    setStatusMessage(null);
    setSubmitting(true);

    try {
      if (!isValidEmail(email)) {
        throw new Error("Renseigne un email valide.");
      }
      if (password.length < 8) {
        throw new Error("Le mot de passe doit contenir au moins 8 caracteres.");
      }
      if (mode === "signup" && password !== confirmPassword) {
        throw new Error("Les mots de passe ne correspondent pas.");
      }

      const endpoint = mode === "signup" ? "/api/auth/sign-up" : "/api/auth/sign-in";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ email, password })
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; needsEmailConfirmation?: boolean; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.message ?? "Impossible de se connecter.");
      }

      if (data?.needsEmailConfirmation) {
        setNeedsEmailConfirmation(true);
        setStatusMessage("Compte cree ! Verifie ton email et clique sur le lien — tu seras redirige automatiquement.");
        return;
      }

      await auth.refreshSession();
      await auth.refreshRouting();

      setStatusMessage(mode === "signup" ? "Compte cree. Tu peux continuer l'onboarding." : "Connexion reussie.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de se connecter");
    } finally {
      setSubmitting(false);
    }
  }

  async function resendVerificationEmail() {
    if (!email || resending) return;
    setResending(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ email })
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.message ?? "Impossible de renvoyer l'email.");
      }

      setStatusMessage(data?.message ?? "Email de verification renvoye.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de renvoyer l'email.");
    } finally {
      setResending(false);
    }
  }

  function setMode(modeValue: "signup" | "signin") {
    setModeState(modeValue);
    if (modeValue === "signin") {
      setConfirmPassword("");
    }
    setNeedsEmailConfirmation(false);
    setStatusMessage(null);
    setErrorMessage(null);
  }

  async function signOut() {
    await auth.signOut();
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }

  return {
    user: auth.user,
    loadingSession: auth.loading,
    mode,
    email,
    password,
    confirmPassword,
    submitting,
    needsEmailConfirmation,
    resending,
    statusMessage,
    errorMessage: errorMessage ?? auth.error,
    setMode,
    setEmail,
    setPassword,
    setConfirmPassword,
    submitCredentials,
    resendVerificationEmail,
    signOut
  };
}
