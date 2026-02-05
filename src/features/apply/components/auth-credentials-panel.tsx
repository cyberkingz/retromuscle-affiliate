import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidEmail } from "@/lib/validation";

interface AuthCredentialsPanelProps {
  mode: "signup" | "signin";
  email: string;
  password: string;
  confirmPassword: string;
  submitting: boolean;
  errorMessage?: string | null;
  showModeSwitch?: boolean;
  onModeChange(mode: "signup" | "signin"): void;
  onEmailChange(value: string): void;
  onPasswordChange(value: string): void;
  onConfirmPasswordChange(value: string): void;
  onSubmit(): void;
}

export function AuthCredentialsPanel({
  mode,
  email,
  password,
  confirmPassword,
  submitting,
  errorMessage,
  showModeSwitch = true,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit
}: AuthCredentialsPanelProps) {
  const emailIssueId = useId();
  const passwordHintId = useId();
  const confirmIssueId = useId();
  const formErrorId = useId();

  const isSignup = mode === "signup";
  const hasEmail = email.trim().length > 0;
  const hasValidEmail = isValidEmail(email);
  const hasPassword = password.length >= 8;
  const hasConfirm = !isSignup || confirmPassword.length > 0;
  const passwordsMatch = !isSignup || confirmPassword.length === 0 || confirmPassword === password;
  const canSubmit = hasEmail && hasValidEmail && hasPassword && hasConfirm && passwordsMatch && !submitting;

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {showModeSwitch ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="pill" variant={isSignup ? "default" : "outline"} onClick={() => onModeChange("signup")}>
            Creer un compte
          </Button>
          <Button type="button" size="pill" variant={isSignup ? "outline" : "default"} onClick={() => onModeChange("signin")}>
            Se connecter
          </Button>
        </div>
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Email</span>
        <Input
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="toi@email.com"
          aria-invalid={hasEmail && !hasValidEmail}
          aria-describedby={hasEmail && !hasValidEmail ? emailIssueId : undefined}
        />
        {hasEmail && !hasValidEmail ? (
          <p id={emailIssueId} className="text-xs text-destructive">
            Format email invalide.
          </p>
        ) : null}
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Mot de passe</span>
        <Input
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="Minimum 8 caracteres"
          aria-invalid={password.length > 0 && !hasPassword}
          aria-describedby={passwordHintId}
        />
        {!hasPassword && password.length > 0 ? (
          <p id={passwordHintId} className="text-xs text-destructive">
            Minimum 8 caracteres.
          </p>
        ) : (
          <p id={passwordHintId} className="text-xs text-foreground/60">
            Au moins 8 caracteres.
          </p>
        )}
      </label>

      {isSignup ? (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Confirmer le mot de passe</span>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(event) => onConfirmPasswordChange(event.target.value)}
            placeholder="Retape ton mot de passe"
            aria-invalid={!passwordsMatch}
            aria-describedby={!passwordsMatch ? confirmIssueId : undefined}
          />
          {!passwordsMatch ? (
            <p id={confirmIssueId} className="text-xs text-destructive">
              Les mots de passe ne correspondent pas.
            </p>
          ) : null}
        </label>
      ) : null}

      {errorMessage ? (
        <p id={formErrorId} className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <Button type="submit" disabled={!canSubmit} size="pill" className="w-full sm:w-auto">
        {submitting ? "Chargement..." : isSignup ? "Creer mon compte" : "Me connecter"}
      </Button>

      <p className="text-xs text-foreground/65">
        {isSignup ? "Inscription simple par email + mot de passe." : "Connecte-toi pour reprendre ton onboarding."}
      </p>

      {isSignup && (
        <div className="rounded-xl border border-secondary/20 bg-frost/50 p-3">
          <p className="text-[11px] font-medium leading-relaxed text-secondary/80">
            Les places sont ouvertes chaque semaine selon les besoins campagnes.
          </p>
        </div>
      )}
    </form>
  );
}
