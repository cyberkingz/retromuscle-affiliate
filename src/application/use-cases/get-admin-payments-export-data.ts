import { getRepository } from "@/application/dependencies";
import { calculatePayout } from "@/domain/services/calculate-payout";
import { resolveCurrentMonth, resolveMonth } from "@/application/use-cases/shared";

export interface AdminPaymentsExportRow {
  monthlyTrackingId: string;
  month: string;
  creatorId: string;
  creatorHandle: string;
  creatorEmail: string;
  paymentStatus: string;
  paidAt?: string;
  amount: number;
  payoutMethod: string | null;
  accountHolderName: string | null;
  iban: string | null;
  paypalEmail: string | null;
}

export async function getAdminPaymentsExportData(input?: { month?: string }): Promise<{
  month: string;
  rows: AdminPaymentsExportRow[];
}> {
  const repository = getRepository();
  const [creators, rates] = await Promise.all([repository.listCreators(), repository.listRates()]);

  // Fetch all trackings in a single query to avoid a double-fetch in the fallback path.
  const allTrackings = await repository.listMonthlyTrackings();
  const availableMonths = Array.from(new Set(allTrackings.map((t) => t.month)));

  const targetMonth = input?.month
    ? resolveMonth(input.month, availableMonths)
    : resolveMonth(resolveCurrentMonth(), availableMonths);

  const monthTrackings = allTrackings.filter((t) => t.month === targetMonth);
  const creatorById = new Map(creators.map((creator) => [creator.id, creator]));

  // Fetch all payout profiles in a single query (fixes N+1)
  const allProfiles = await repository.listPayoutProfiles();
  const profileByCreatorId = new Map(allProfiles.map((p) => [p.creatorId, p]));

  const rows: AdminPaymentsExportRow[] = monthTrackings.map((tracking) => {
    const creator = creatorById.get(tracking.creatorId);
    if (!creator) {
      throw new Error(`Creator not found for tracking ${tracking.id}`);
    }

    const payout = calculatePayout(tracking.delivered, rates);
    const profile = profileByCreatorId.get(tracking.creatorId) ?? null;

    return {
      monthlyTrackingId: tracking.id,
      month: tracking.month,
      creatorId: creator.id,
      creatorHandle: creator.handle,
      creatorEmail: creator.email,
      paymentStatus: tracking.paymentStatus,
      paidAt: tracking.paidAt,
      amount: payout.total,
      payoutMethod: profile?.method ?? null,
      accountHolderName: profile?.accountHolderName ?? null,
      iban: profile?.iban ?? null,
      paypalEmail: profile?.paypalEmail ?? null
    };
  });

  return { month: targetMonth, rows };
}
