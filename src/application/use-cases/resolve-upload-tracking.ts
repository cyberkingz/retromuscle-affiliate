import { getRepository } from "@/application/dependencies";
import { createZeroDeliveredCount, resolveCurrentMonth } from "@/application/use-cases/shared";

export interface UploadTrackingContext {
  creatorId: string;
  monthlyTrackingId: string;
  month: string;
}

/**
 * Resolve a valid tracking row for creator uploads.
 *
 * If the provided tracking id is missing/stale, this falls back to the current
 * month row and creates it on demand.
 */
export async function resolveUploadTrackingForUser(input: {
  userId: string;
  monthlyTrackingId?: string | null;
}): Promise<UploadTrackingContext> {
  const repository = getRepository();
  const creator = await repository.getCreatorByUserId(input.userId);
  if (!creator) {
    throw new Error("Creator not found");
  }

  if (!creator.contractSignedAt) {
    throw new Error("Contract not signed");
  }

  if (creator.status !== "actif") {
    throw new Error("Creator account is not active");
  }

  if (input.monthlyTrackingId) {
    const byId = await repository.getMonthlyTrackingById(input.monthlyTrackingId);
    if (byId && byId.creatorId === creator.id) {
      return {
        creatorId: creator.id,
        monthlyTrackingId: byId.id,
        month: byId.month
      };
    }
  }

  const currentMonth = resolveCurrentMonth();
  const existing = await repository.getMonthlyTracking(creator.id, currentMonth);
  if (existing) {
    return {
      creatorId: creator.id,
      monthlyTrackingId: existing.id,
      month: existing.month
    };
  }

  const created = await repository.createMonthlyTracking({
    creatorId: creator.id,
    month: currentMonth,
    delivered: createZeroDeliveredCount()
  });

  return {
    creatorId: creator.id,
    monthlyTrackingId: created.id,
    month: created.month
  };
}
