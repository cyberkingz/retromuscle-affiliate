interface FlashMessagesProps {
  statusMessage?: string | null;
  errorMessage?: string | null;
}

export function FlashMessages({ statusMessage, errorMessage }: FlashMessagesProps) {
  if (!statusMessage && !errorMessage) {
    return null;
  }

  return (
    <div className="space-y-2">
      {statusMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-mint/35 bg-mint/10 px-4 py-3 text-sm text-mint"
        >
          {statusMessage}
        </div>
      ) : null}
      {errorMessage ? (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
