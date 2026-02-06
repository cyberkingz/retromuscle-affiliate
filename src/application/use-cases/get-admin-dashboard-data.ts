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
    creatorHandle: string;
    deliveredSummary: string;
    amount: number;
    paymentStatus: string;
    paymentStatusKey: PaymentStatus;
  }>;
}

export async function getAdminDashboardData(input?: { month?: string }): Promise<AdminDashboardData> {
  const repository = getRepository();
  const [creators, allTrackings, rates, packages, pendingVideos] = await Promise.all([
    repository.listCreators(),
    repository.listMonthlyTrackings(),
    repository.listRates(),
    repository.listPackageDefinitions(),
    repository.listVideosByStatus("pending_review")
  ]);

  const targetMonth = resolveMonth(
    input?.month,
    Array.from(new Set(allTrackings.map((tracking) => tracking.month)))
  );

  const monthTrackings = allTrackings.filter((tracking) => tracking.month === targetMonth);
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
    payments: monthlyRows.map((row) => ({
      creatorHandle: row.handle,
      deliveredSummary: `${row.deliveredTotal}/${row.packageTier}`,
      amount: row.payoutAmount,
      paymentStatus: row.paymentStatus,
      paymentStatusKey: row.paymentStatusKey
    }))
  };
}
