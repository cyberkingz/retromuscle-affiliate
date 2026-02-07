import { getRepository } from "@/application/dependencies";

export async function markMonthlyTrackingPaid(input: { monthlyTrackingId: string; paidAt?: string | null }) {
  const repository = getRepository();
  return repository.markMonthlyTrackingPaid({
    monthlyTrackingId: input.monthlyTrackingId,
    paidAt: input.paidAt ?? null
  });
}

