import { getRepository } from "@/application/dependencies";
import {
  CREATOR_STATUS_LABELS,
  MIX_LABELS,
  PAYMENT_STATUS_LABELS,
  VIDEO_TYPE_LABELS
} from "@/domain/constants/labels";
import { calculatePayout } from "@/domain/services/calculate-payout";
import { summarizeTracking } from "@/domain/services/tracking-summary";
import { VIDEO_TYPES, type PaymentStatus } from "@/domain/types";
import { resolveMonth } from "@/application/use-cases/shared";

export interface AdminDashboardData {
  month: string;
  metrics: {
    creatorsComplete: number;
    creatorsPending: number;
    validationTodo: number;
    paymentsTodo: number;
    totalToPay: number;
  };
  creatorsMaster: Array<{
    creatorId: string;
    handle: string;
    email: string;
    country: string;
    packageTier: number;
    mixName: string;
    mixLabel: string;
    status: string;
  }>;
  monthlyRows: Array<{
    monthlyTrackingId: string;
    creatorId: string;
    handle: string;
    packageTier: number;
    mixLabel: string;
    quotas: Record<string, number>;
    delivered: Record<string, number>;
    deliveredTotal: number;
    remainingTotal: number;
    deadline: string;
    paymentStatus: string;
    paymentStatusKey: PaymentStatus;
    payoutAmount: number;
  }>;
  validationQueue: Array<{
    videoId: string;
    creatorHandle: string;
    videoType: string;
    fileUrl: string;
    uploadedAt: string;
    durationSeconds: number;
    resolution: string;
  }>;
  payments: Array<{
    monthlyTrackingId: string;
    creatorId: string;
    email: string;
    creatorHandle: string;
    deliveredSummary: string;
    amount: number;
    paymentStatus: string;
    paymentStatusKey: PaymentStatus;
    hasPayoutProfile: boolean;
  }>;
}

export async function getAdminDashboardData(input?: { month?: string }): Promise<AdminDashboardData> {
  const repository = getRepository();
  const [creators, rates, packages, pendingVideos] = await Promise.all([
    repository.listCreators(),
    repository.listRates(),
    repository.listPackageDefinitions(),
    repository.listVideosByStatus("pending_review")
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
  const packageMap = new Map(packages.map((pkg) => [pkg.tier, pkg]));
  const creatorById = new Map(creators.map((creator) => [creator.id, creator]));

  const monthlyRows = monthTrackings.map((tracking) => {
    const creator = creatorById.get(tracking.creatorId);
    const pkg = packageMap.get(tracking.packageTier);

    if (!creator || !pkg) {
      throw new Error(`Invalid tracking row for ${tracking.id}`);
    }

    const summary = summarizeTracking(tracking.quotas, tracking.delivered);
    const payout = calculatePayout(tracking.delivered, rates, pkg.monthlyCredits);

    return {
      monthlyTrackingId: tracking.id,
        creatorId: creator.id,
        handle: creator.handle,
        packageTier: tracking.packageTier,
        mixLabel: MIX_LABELS[tracking.mixName],
      quotas: Object.fromEntries(
        VIDEO_TYPES.map((videoType) => [VIDEO_TYPE_LABELS[videoType], tracking.quotas[videoType]])
      ),
      delivered: Object.fromEntries(
        VIDEO_TYPES.map((videoType) => [VIDEO_TYPE_LABELS[videoType], tracking.delivered[videoType]])
      ),
      deliveredTotal: summary.deliveredTotal,
      remainingTotal: summary.remainingTotal,
      deadline: tracking.deadline,
      paymentStatus: PAYMENT_STATUS_LABELS[tracking.paymentStatus],
      paymentStatusKey: tracking.paymentStatus,
      payoutAmount: payout.total
    };
  });

  const creatorsComplete = monthlyRows.filter((row) => row.remainingTotal === 0).length;
  const creatorsPending = monthlyRows.filter((row) => row.remainingTotal > 0).length;
  const paymentsTodoRows = monthlyRows.filter((row) => row.paymentStatusKey !== "paye");

  const metrics = {
    creatorsComplete,
    creatorsPending,
    validationTodo: pendingVideos.length,
    paymentsTodo: paymentsTodoRows.length,
    totalToPay: paymentsTodoRows.reduce((sum, row) => sum + row.payoutAmount, 0)
  };

  return {
    month: targetMonth,
    metrics,
    creatorsMaster: creators.map((creator) => ({
      creatorId: creator.id,
      handle: creator.handle,
      email: creator.email,
      country: creator.country,
      packageTier: creator.packageTier,
      mixName: creator.defaultMix,
      mixLabel: MIX_LABELS[creator.defaultMix],
      status: CREATOR_STATUS_LABELS[creator.status]
    })),
    monthlyRows,
    validationQueue: pendingVideos.map((video) => {
      const creator = creatorById.get(video.creatorId);
      return {
        videoId: video.id,
        creatorHandle: creator?.handle ?? "@inconnu",
        videoType: VIDEO_TYPE_LABELS[video.videoType],
        fileUrl: video.fileUrl,
        uploadedAt: video.createdAt,
        durationSeconds: video.durationSeconds,
        resolution: video.resolution
      };
    }),
    payments: await (async () => {
      const uniqueCreatorIds = [...new Set(monthlyRows.map((row) => row.creatorId))];
      const profiles = await Promise.all(
        uniqueCreatorIds.map((id) => repository.getPayoutProfileByCreatorId(id))
      );
      const validProfileCreatorIds = new Set(
        uniqueCreatorIds.filter((id, i) => {
          const p = profiles[i];
          if (!p) return false;
          if (p.method === "iban" && !p.iban) return false;
          if (p.method === "paypal" && !p.paypalEmail) return false;
          if (p.method === "stripe" && !p.stripeAccount) return false;
          return true;
        })
      );
      return monthlyRows.map((row) => ({
        monthlyTrackingId: row.monthlyTrackingId,
        creatorId: row.creatorId,
        email: creatorById.get(row.creatorId)?.email ?? "",
        creatorHandle: row.handle,
        deliveredSummary: `${row.deliveredTotal}/${row.packageTier}`,
        amount: row.payoutAmount,
        paymentStatus: row.paymentStatus,
        paymentStatusKey: row.paymentStatusKey,
        hasPayoutProfile: validProfileCreatorIds.has(row.creatorId)
      }));
    })()
  };
}
