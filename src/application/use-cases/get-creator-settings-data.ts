import { getRepository } from "@/application/dependencies";
export interface CreatorSettingsData {
  creator: {
    id: string;
    handle: string;
    displayName: string;
    email: string;
    country: string;
  };
  payoutProfile: {
    method: "iban" | "paypal" | "stripe";
    accountHolderName?: string | null;
    ibanLast4?: string | null;
    paypalEmail?: string | null;
    stripeAccount?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export async function getCreatorSettingsData(input: { creatorId: string }): Promise<CreatorSettingsData> {
  const repository = getRepository();

  const [creator, payoutProfile] = await Promise.all([
    repository.getCreatorById(input.creatorId),
    repository.getPayoutProfileByCreatorId(input.creatorId)
  ]);

  if (!creator) {
    throw new Error("Creator not found");
  }

  const ibanLast4 = payoutProfile?.iban
    ? payoutProfile.iban.replace(/\s+/g, "").slice(-4)
    : null;

  return {
    creator: {
      id: creator.id,
      handle: creator.handle,
      displayName: creator.displayName,
      email: creator.email,
      country: creator.country
    },
    payoutProfile: payoutProfile
      ? {
          method: payoutProfile.method,
          accountHolderName: payoutProfile.accountHolderName ?? null,
          ibanLast4,
          paypalEmail: payoutProfile.paypalEmail ?? null,
          stripeAccount: payoutProfile.stripeAccount ?? null,
          createdAt: payoutProfile.createdAt,
          updatedAt: payoutProfile.updatedAt
        }
      : null
  };
}
