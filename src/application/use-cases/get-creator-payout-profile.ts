import { getRepository } from "@/application/dependencies";
import type { CreatorPayoutProfile } from "@/domain/types";

export async function getCreatorPayoutProfile(input: { userId: string }): Promise<CreatorPayoutProfile | null> {
  const repository = getRepository();
  const creator = await repository.getCreatorByUserId(input.userId);
  if (!creator) {
    return null;
  }

  return repository.getPayoutProfileByCreatorId(creator.id);
}

