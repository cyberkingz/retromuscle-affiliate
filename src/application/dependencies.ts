import type { CreatorRepository } from "@/application/repositories/creator-repository";
import { InMemoryCreatorRepository } from "@/application/repositories/in-memory-creator-repository";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/infrastructure/supabase/server-client";
import { SupabaseCreatorRepository } from "@/infrastructure/supabase/supabase-creator-repository";

let repository: CreatorRepository | null = null;

export function getRepository(): CreatorRepository {
  if (repository) {
    return repository;
  }

  if (isSupabaseConfigured()) {
    repository = new SupabaseCreatorRepository(createSupabaseServerClient());
    return repository;
  }

  repository = new InMemoryCreatorRepository();
  return repository;
}
