"use client";

import { useCallback, useState } from "react";

export interface PreviewItem {
  id: string;
  fileUrl: string;
  videoType?: string;
  resolution?: string;
  durationSeconds?: number;
  fileName?: string;
  fileSizeMb?: number;
  status?: string;
}

interface VideoPreviewState {
  isOpen: boolean;
  signedUrl: string | null;
  loading: boolean;
  error: string | null;
  currentIndex: number;
  items: PreviewItem[];
}

export interface UseVideoPreviewReturn {
  isOpen: boolean;
  signedUrl: string | null;
  loading: boolean;
  error: string | null;
  currentItem: PreviewItem | null;
  currentIndex: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
  open: (item: PreviewItem, allItems?: PreviewItem[]) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
}

async function fetchSignedUrl(
  fileUrl: string,
  endpoint: "/api/videos/preview" | "/api/rushes/preview"
): Promise<string> {
  const response = await fetch(
    `${endpoint}?fileUrl=${encodeURIComponent(fileUrl)}`,
    { cache: "no-store" }
  );
  const payload = (await response.json().catch(() => null)) as {
    signedUrl?: string;
    message?: string;
  } | null;

  if (!response.ok || !payload?.signedUrl) {
    throw new Error(
      payload?.message ?? "Impossible de generer un lien de preview."
    );
  }

  return payload.signedUrl;
}

export function useVideoPreview(
  endpoint: "/api/videos/preview" | "/api/rushes/preview" = "/api/videos/preview"
): UseVideoPreviewReturn {
  const [state, setState] = useState<VideoPreviewState>({
    isOpen: false,
    signedUrl: null,
    loading: false,
    error: null,
    currentIndex: 0,
    items: [],
  });

  const loadUrl = useCallback(
    async (item: PreviewItem) => {
      setState((prev) => ({ ...prev, loading: true, error: null, signedUrl: null }));
      try {
        const url = await fetchSignedUrl(item.fileUrl, endpoint);
        setState((prev) => ({ ...prev, loading: false, signedUrl: url }));
      } catch (caught) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            caught instanceof Error
              ? caught.message
              : "Impossible de generer un lien de preview.",
        }));
      }
    },
    [endpoint]
  );

  const open = useCallback(
    (item: PreviewItem, allItems?: PreviewItem[]) => {
      const items = allItems ?? [item];
      const index = items.findIndex((i) => i.id === item.id);
      setState({
        isOpen: true,
        signedUrl: null,
        loading: false,
        error: null,
        currentIndex: index >= 0 ? index : 0,
        items,
      });
      void loadUrl(item);
    },
    [loadUrl]
  );

  const close = useCallback(() => {
    setState({
      isOpen: false,
      signedUrl: null,
      loading: false,
      error: null,
      currentIndex: 0,
      items: [],
    });
  }, []);

  const navigate = useCallback(
    (direction: 1 | -1) => {
      setState((prev) => {
        const nextIndex = prev.currentIndex + direction;
        if (nextIndex < 0 || nextIndex >= prev.items.length) return prev;
        const nextItem = prev.items[nextIndex];
        if (!nextItem) return prev;
        void loadUrl(nextItem);
        return { ...prev, currentIndex: nextIndex, signedUrl: null, loading: true, error: null };
      });
    },
    [loadUrl]
  );

  const next = useCallback(() => navigate(1), [navigate]);
  const prev = useCallback(() => navigate(-1), [navigate]);

  const currentItem =
    state.items.length > 0 ? (state.items[state.currentIndex] ?? null) : null;

  return {
    isOpen: state.isOpen,
    signedUrl: state.signedUrl,
    loading: state.loading,
    error: state.error,
    currentItem,
    currentIndex: state.currentIndex,
    totalItems: state.items.length,
    hasNext: state.currentIndex < state.items.length - 1,
    hasPrev: state.currentIndex > 0,
    open,
    close,
    next,
    prev,
  };
}
