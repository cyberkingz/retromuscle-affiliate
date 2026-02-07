import { getRepository } from "@/application/dependencies";
import type { CreatorPayoutProfile } from "@/domain/types";

export async function saveCreatorPayoutProfile(input: {
  userId: string;
  method: CreatorPayoutProfile["method"];
  accountHolderName?: string | null;
  iban?: string | null;
  paypalEmail?: string | null;
  stripeAccount?: string | null;
}): Promise<CreatorPayoutProfile> {
  const repository = getRepository();
  const creator = await repository.getCreatorByUserId(input.userId);
  if (!creator) {
    throw new Error("Creator not found");
  }

  return repository.upsertPayoutProfile({
    creatorId: creator.id,
    method: input.method,
    accountHolderName: input.accountHolderName ?? null,
    iban: input.iban ?? null,
    paypalEmail: input.paypalEmail ?? null,
    stripeAccount: input.stripeAccount ?? null
  });
}

