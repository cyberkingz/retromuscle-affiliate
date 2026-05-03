"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

interface MutationState {
  isPending: boolean;
  error: string | null;
}

type MutationMethod = "POST" | "PATCH" | "DELETE";

export function useResourceMutation<TPayload = void>(
  endpoint: string,
  method: MutationMethod = "POST"
) {
  const router = useRouter();
  const [state, setState] = useState<MutationState>({ isPending: false, error: null });

  const mutate = useCallback(
    async (payload?: TPayload): Promise<boolean> => {
      setState({ isPending: true, error: null });
      try {
        const response = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: payload !== undefined ? JSON.stringify(payload) : undefined
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const message = (body as { message?: string } | null)?.message ?? `Erreur ${response.status}`;
          setState({ isPending: false, error: message });
          return false;
        }

        setState({ isPending: false, error: null });
        router.refresh();
        return true;
      } catch {
        setState({ isPending: false, error: "Erreur réseau. Réessaie." });
        return false;
      }
    },
    [endpoint, method, router]
  );

  const reset = useCallback(() => setState({ isPending: false, error: null }), []);

  return { ...state, mutate, reset };
}
