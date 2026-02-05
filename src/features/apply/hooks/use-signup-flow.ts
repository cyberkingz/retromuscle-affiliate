"use client";

import { useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { useAuth } from "@/features/auth/context/auth-context";
import { isValidEmail } from "@/lib/validation";

interface UseSignupFlowResult {
  session: Session | null;
  loadingSession: boolean;
  mode: "signup" | "signin";
  email: string;
  password: string;
  confirmPassword: string;
  submitting: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
  setMode(value: "signup" | "signin"): void;
  setEmail(value: string): void;
  setPassword(value: string): void;
  setConfirmPassword(value: string): void;
  submitCredentials(): Promise<void>;
  signOut(): Promise<void>;
}

export function useSignupFlow(initialMode: "signup" | "signin" = "signup"): UseSignupFlowResult {
  const auth = useAuth();
  const [mode, setModeState] = useState<"signup" | "signin">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
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

      if (!auth.client) {
        throw new Error(auth.error ?? "Supabase is not configured");
      }
      const supabase = auth.client;

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) {
          throw error;
        }

        if (!data.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) {
            setStatusMessage("Compte cree. Connecte-toi ensuite pour continuer.");
            return;
          }
        }

        setStatusMessage("Compte cree. Tu peux continuer l'onboarding.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
      setStatusMessage("Connexion reussie. Tu peux continuer l'onboarding.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de se connecter");
    } finally {
      setSubmitting(false);
    }
  }

  function setMode(modeValue: "signup" | "signin") {
    setModeState(modeValue);
    if (modeValue === "signin") {
      setConfirmPassword("");
    }
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
    session: auth.session as Session | null,
    loadingSession: auth.loading,
    mode,
    email,
    password,
    confirmPassword,
    submitting,
    statusMessage,
    errorMessage: errorMessage ?? auth.error,
    setMode,
    setEmail,
    setPassword,
    setConfirmPassword,
    submitCredentials,
    signOut
  };
}
