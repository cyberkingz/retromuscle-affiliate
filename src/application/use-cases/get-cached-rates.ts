import { unstable_cache } from "next/cache";

import { getRepository } from "@/application/dependencies";

/**
 * Fetch video rates with Next.js data cache.
 *
 * Rates change rarely (manual admin action), so caching for 60s is safe.
 * The cache is invalidated automatically when `updateVideoRate` or
 * `deleteVideoRate` is called (they should call `revalidateTag("rates")`),
 * or it will expire naturally after 60 s.
 */
export const getCachedRates = unstable_cache(
  async () => getRepository().listRates(),
  ["video-rates"],
  { revalidate: 60, tags: ["rates"] }
);
