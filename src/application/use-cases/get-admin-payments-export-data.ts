import { getRepository } from "@/application/dependencies";
import { calculatePayout } from "@/domain/services/calculate-payout";
import { resolveMonth } from "@/application/use-cases/shared";

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
  stripeAccount: string | null;
}

export async function getAdminPaymentsExportData(input?: { month?: string }): Promise<{
  month: string;
  rows: AdminPaymentsExportRow[];
}> {
  const repository = getRepository();
  const [creators, rates, packages] = await Promise.all([
    repository.listCreators(),
    repository.listRates(),
    repository.listPackageDefinitions()
  ]);

  let targetMonth: string;
  let monthTrackings = [] as Awaited<ReturnType<typeof repository.listMonthlyTrackings>>;

  if (input?.month) {
    const trackings = await repository.listMonthlyTrackings(input.month);
    targetMonth = resolveMonth(input.month, Array.from(new Set(trackings.map((tracking) => tracking.month))));
    monthTrackings = trackings;
  } else {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const current = await repository.listMonthlyTrackings(currentMonth);

    if (current.length > 0) {
      targetMonth = currentMonth;
      monthTrackings = current;
    } else {
      const allTrackings = await repository.listMonthlyTrackings();
      targetMonth = resolveMonth(undefined, Array.from(new Set(allTrackings.map((tracking) => tracking.month))));
      monthTrackings = allTrackings.filter((tracking) => tracking.month === targetMonth);
    }
  }
  const creatorById = new Map(creators.map((creator) => [creator.id, creator]));
  const packageByTier = new Map(packages.map((pkg) => [pkg.tier, pkg]));

  const payoutProfiles = await Promise.all(
    monthTrackings.map((tracking) => repository.getPayoutProfileByCreatorId(tracking.creatorId))
  );

  const rows: AdminPaymentsExportRow[] = monthTrackings.map((tracking, index) => {
    const creator = creatorById.get(tracking.creatorId);
    if (!creator) {
      throw new Error(`Creator not found for tracking ${tracking.id}`);
    }

    const pkg = packageByTier.get(tracking.packageTier);
    if (!pkg) {
      throw new Error(`Package not found for tracking ${tracking.id}`);
    }

    const payout = calculatePayout(tracking.delivered, rates, pkg.monthlyCredits);
    const profile = payoutProfiles[index] ?? null;

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
      paypalEmail: profile?.paypalEmail ?? null,
      stripeAccount: profile?.stripeAccount ?? null
    };
  });

  return { month: targetMonth, rows };
}
