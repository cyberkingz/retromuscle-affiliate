import { getRepository } from "@/application/dependencies";
import {
  CREATOR_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  VIDEO_TYPE_LABELS
} from "@/domain/constants/labels";
import { calculatePayout } from "@/domain/services/calculate-payout";
import { deriveKitStatusForCreator } from "@/domain/services/derive-kit-status";
import { summarizeTracking } from "@/domain/services/tracking-summary";
import { VIDEO_TYPES, type CreatorKitStatus, type PaymentStatus } from "@/domain/types";
import { resolveMonth } from "@/application/use-cases/shared";

export interface AdminDashboardData {
  month: string;
  availableMonths: string[];
  metrics: {
    creatorsActive: number;
    validationTodo: number;
    paymentsTodo: number;
    totalToPay: number;
  };
  creatorsMaster: Array<{
    creatorId: string;
    handle: string;
    email: string;
    country: string;
    status: string;
    kitStatus: CreatorKitStatus;
  }>;
  monthlyRows: Array<{
    monthlyTrackingId: string;
    creatorId: string;
    handle: string;
    delivered: Record<string, number>;
    deliveredTotal: number;
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
  kitOrders: Array<{
    creatorId: string;
    handle: string;
    promoCode: string;
    orderedAt: string;
    shopifyOrderId: string;
    orderAmount: number | null;
    orderCurrency: string | null;
  }>;
}

export async function getAdminDashboardData(input?: {
  month?: string;
}): Promise<AdminDashboardData> {
  const repository = getRepository();
  const [creators, rates, pendingVideos, allTrackings] = await Promise.all([
    repository.listCreators(),
    repository.listRates(),
    repository.listVideosByStatus("pending_review"),
    repository.listMonthlyTrackings()
  ]);

  const availableMonths = [...new Set(allTrackings.map((t) => t.month))].sort((a, b) =>
    b.localeCompare(a)
  );
  const targetMonth = resolveMonth(input?.month, availableMonths);
  const monthTrackings = allTrackings.filter((t) => t.month === targetMonth);
  const creatorById = new Map(creators.map((creator) => [creator.id, creator]));

  const monthlyRows = monthTrackings.map((tracking) => {
    const creator = creatorById.get(tracking.creatorId);

    if (!creator) {
      throw new Error(`Invalid tracking row for ${tracking.id}`);
    }

    const summary = summarizeTracking(tracking.delivered);
    const payout = calculatePayout(tracking.delivered, rates);

    return {
      monthlyTrackingId: tracking.id,
      creatorId: creator.id,
      handle: creator.handle,
      delivered: Object.fromEntries(
        VIDEO_TYPES.map((videoType) => [
          VIDEO_TYPE_LABELS[videoType],
          tracking.delivered[videoType]
        ])
      ),
      deliveredTotal: summary.deliveredTotal,
      paymentStatus: PAYMENT_STATUS_LABELS[tracking.paymentStatus],
      paymentStatusKey: tracking.paymentStatus,
      payoutAmount: payout.total
    };
  });

  const paymentsTodoRows = monthlyRows.filter(
    (row) => row.paymentStatusKey !== "paye" && row.payoutAmount > 0
  );

  const metrics = {
    creatorsActive: monthlyRows.length,
    validationTodo: pendingVideos.length,
    paymentsTodo: paymentsTodoRows.length,
    totalToPay: paymentsTodoRows.reduce((sum, row) => sum + row.payoutAmount, 0)
  };

  return {
    month: targetMonth,
    availableMonths,
    metrics,
    creatorsMaster: creators.map((creator) => ({
      creatorId: creator.id,
      handle: creator.handle,
      email: creator.email,
      country: creator.country,
      status: CREATOR_STATUS_LABELS[creator.status],
      kitStatus: deriveKitStatusForCreator(creator)
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
      // Single query instead of N+1 per creator
      const allProfiles = await repository.listPayoutProfiles();
      const validProfileCreatorIds = new Set(
        allProfiles
          .filter((p) => {
            if (p.method === "iban" && !p.iban) return false;
            if (p.method === "paypal" && !p.paypalEmail) return false;
            return true;
          })
          .map((p) => p.creatorId)
      );
      return monthlyRows.map((row) => ({
        monthlyTrackingId: row.monthlyTrackingId,
        creatorId: row.creatorId,
        email: creatorById.get(row.creatorId)?.email ?? "",
        creatorHandle: row.handle,
        deliveredSummary: `${row.deliveredTotal} videos`,
        amount: row.payoutAmount,
        paymentStatus: row.paymentStatus,
        paymentStatusKey: row.paymentStatusKey,
        hasPayoutProfile: validProfileCreatorIds.has(row.creatorId)
      }));
    })(),
    kitOrders: creators
      .filter((c) => c.kitOrderPlacedAt)
      .map((c) => ({
        creatorId: c.id,
        handle: c.handle,
        promoCode: c.kitPromoCode ?? "",
        orderedAt: c.kitOrderPlacedAt!,
        shopifyOrderId: c.shopifyKitOrderId ?? "",
        orderAmount: c.kitOrderAmount ?? null,
        orderCurrency: c.kitOrderCurrency ?? null
      }))
      .sort((a, b) => b.orderedAt.localeCompare(a.orderedAt))
  };
}
