import { getRepository } from "@/application/dependencies";
import type { Creator } from "@/domain/types";

export type UpdateCreatorStatusInput = {
  creatorId: string;
  status: Extract<Creator["status"], "actif" | "pause" | "inactif">;
};

export async function updateCreatorStatus(input: UpdateCreatorStatusInput): Promise<Creator> {
  const repository = getRepository();

  const creator = await repository.getCreatorById(input.creatorId);
  if (!creator) {
    throw new Error("Creator not found");
  }

  // candidat status can only be set via application provisioning, not manually
  if (creator.status === "candidat") {
    throw new Error("Cannot change status of a candidat creator via this route");
  }

  return repository.updateCreatorStatus({
    creatorId: input.creatorId,
    status: input.status
  });
}
