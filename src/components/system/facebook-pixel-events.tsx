"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { pageview } from "@/lib/facebook-pixel";

/**
 * Fires fbq PageView on every client-side route change in the App Router.
 * Must be wrapped in <Suspense> in the root layout because useSearchParams()
 * opts the subtree out of static rendering.
 */
export function FacebookPixelEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    pageview();
  }, [pathname, searchParams]);

  return null;
}
