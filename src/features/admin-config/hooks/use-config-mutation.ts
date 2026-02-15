"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

interface MutationState {
  isPending: boolean;
  error: string | null;
  lastSuccess: string | null;
}

export function useConfigMutation<TPayload>(endpoint: string) {
  const router = useRouter();
  const [state, setState] = useState<MutationState>({
    isPending: false,
    error: null,
    lastSuccess: null
  });

  const mutate = useCallback(
    async (payload: TPayload) => {
      setState({ isPending: true, error: null, lastSuccess: null });

      try {
        const response = await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const message = body?.message ?? `Erreur ${response.status}`;
          setState({ isPending: false, error: message, lastSuccess: null });
          return false;
        }

        setState({ isPending: false, error: null, lastSuccess: new Date().toISOString() });
        router.refresh();
        return true;
      } catch {
        setState({ isPending: false, error: "Erreur reseau", lastSuccess: null });
        return false;
      }
    },
    [endpoint, router]
  );

  const reset = useCallback(() => {
    setState({ isPending: false, error: null, lastSuccess: null });
  }, []);

  return { ...state, mutate, reset };
}
