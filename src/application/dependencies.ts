import type { CreatorRepository } from "@/application/repositories/creator-repository";
import type { IResourceRepository } from "@/application/repositories/resource-repository";
import { InMemoryCreatorRepository } from "@/application/repositories/in-memory-creator-repository";
import { InMemoryResourceRepository } from "@/application/repositories/in-memory-resource-repository";
import {
  createSupabaseServerClient,
  isSupabaseConfigured
} from "@/infrastructure/supabase/server-client";
import { SupabaseCreatorRepository } from "@/infrastructure/supabase/supabase-creator-repository";
import { SupabaseResourceRepository } from "@/infrastructure/supabase/supabase-resource-repository";

/**
 * Create a fresh repository instance per call.
 *
 * Previously this was a module-level singleton, meaning a single
 * service-role Supabase client was shared across all requests. Creating
 * fresh instances per call avoids stale connection issues and makes
 * future migration to per-user RLS-aware clients easier.
 */
export function getRepository(): CreatorRepository {
  if (isSupabaseConfigured()) {
    return new SupabaseCreatorRepository(createSupabaseServerClient());
  }

  return new InMemoryCreatorRepository();
}

export function getResourceRepository(): IResourceRepository {
  if (isSupabaseConfigured()) {
    return new SupabaseResourceRepository(createSupabaseServerClient());
  }

  return new InMemoryResourceRepository();
}
