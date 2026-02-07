"use client";

import { useCallback, useEffect, useState } from "react";

export function useScrollEndGate(options?: { thresholdPx?: number }) {
  const thresholdPx = typeof options?.thresholdPx === "number" ? options.thresholdPx : 16;
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);

  const checkReachedEnd = useCallback(() => {
    if (!node) {
      setReachedEnd(false);
      return;
    }

    const { scrollTop, clientHeight, scrollHeight } = node;
    const atEnd = scrollTop + clientHeight >= scrollHeight - thresholdPx;
    setReachedEnd(atEnd);
  }, [node, thresholdPx]);

  useEffect(() => {
    if (!node) return;

    checkReachedEnd();

    const handleScroll = () => {
      checkReachedEnd();
    };

    node.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      node.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [node, checkReachedEnd]);

  return {
    scrollRef: setNode,
    reachedEnd,
    checkReachedEnd
  };
}

