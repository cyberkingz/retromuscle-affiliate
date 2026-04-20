import { getRepository } from "@/application/dependencies";
import { PAYMENT_STATUS_LABELS, VIDEO_TYPE_LABELS } from "@/domain/constants/labels";
import { calculatePayout } from "@/domain/services/calculate-payout";
import { deriveKitStatusForCreator } from "@/domain/services/derive-kit-status";
import { summarizeTracking } from "@/domain/services/tracking-summary";
import { VIDEO_TYPES, type VideoType } from "@/domain/types";
import {
  createZeroDeliveredCount,
  resolveCurrentMonth,
  resolveMonth
} from "@/application/use-cases/shared";

export interface CreatorDashboardData {
  creator: {
    id: string;
    handle: string;
    displayName: string;
    country: string;
    status: string;
    contractSignedAt?: string;
    kitPromoCode?: string;
    kitOrderPlacedAt?: string;
    kitStatus: "not_applicable" | "pending_code" | "code_ready" | "ordered" | "failed";
  };
  month: string;
  progress: {
    deliveredTotal: number;
    estimatedPayout: number;
  };
  deliveredByType: Array<{
    key: string;
    label: string;
    delivered: number;
  }>;
  payoutBreakdown: Array<{
    key: string;
    label: string;
    delivered: number;
    rate: number;
    subtotal: number;
  }>;
  upload: {
    monthlyTrackingId: string;
    ratesByType: Array<{
      videoType: VideoType;
      label: string;
      ratePerVideo: number;
    }>;
    specs: string[];
    tips: Record<string, string[]>;
    pendingReviewCount: number;
    revisionCount: number;
    rejectedCount: number;
    recentVideos: Array<{
      id: string;
      videoType: VideoType;
      status: string;
      createdAt: string;
      fileUrl: string;
      rejectionReason?: string;
      supersededBy?: string;
    }>;
  };
  rushes: {
    totalFiles: number;
    totalSizeMb: number;
    recentRushes: Array<{
      id: string;
      fileName: string;
      fileSizeMb: number;
      fileUrl?: string;
      createdAt: string;
    }>;
  };
  activity: Array<{
    id: string;
    kind: "upload" | "approved" | "rejected" | "revision_requested" | "rush" | "paid" | "contract";
    title: string;
    detail?: string;
    timestamp: string;
    tone: "neutral" | "success" | "warning";
  }>;
  paymentHistory: Array<{
    month: string;
    deliveredTotal: number;
    paymentStatus: string;
    amount: number;
    paidAt?: string;
  }>;
  hasPayoutProfile: boolean;
}

export async function getCreatorDashboardData(input: {
  creatorId?: string;
  month?: string;
}): Promise<CreatorDashboardData> {
  const repository = getRepository();

  if (!input.creatorId) {
    throw new Error("creatorId is required");
  }

  const [creator, rates, trackings, payoutProfile] = await Promise.all([
    repository.getCreatorById(input.creatorId),
    repository.listRates(),
    repository.listCreatorTrackings(input.creatorId),
    repository.getPayoutProfileByCreatorId(input.creatorId)
  ]);

  if (!creator) {
    throw new Error(`Creator ${input.creatorId} not found`);
  }

  const targetMonth = resolveMonth(
    input.month,
    trackings.map((tracking) => tracking.month)
  );

  let allTrackings = [...trackings];
  let currentTracking = allTrackings.find((tracking) => tracking.month === targetMonth) ?? null;

  if (!currentTracking) {
    const fallbackMonth = targetMonth || resolveCurrentMonth();
    currentTracking = await repository.createMonthlyTracking({
      creatorId: creator.id,
      month: fallbackMonth,
      delivered: createZeroDeliveredCount()
    });
    allTrackings = [currentTracking, ...allTrackings];
  }

  const summary = summarizeTracking(currentTracking.delivered);
  const payout = calculatePayout(currentTracking.delivered, rates);

  const activeVideoTypes = new Set(rates.filter((r) => !r.isPlaceholder).map((r) => r.videoType));

  const deliveredByType = VIDEO_TYPES.filter((vt) => activeVideoTypes.has(vt)).map((videoType) => ({
    key: videoType,
    label: VIDEO_TYPE_LABELS[videoType],
    delivered: currentTracking.delivered[videoType]
  }));

  const [uploadedVideos, rushes] = await Promise.all([
    repository.listVideosByTracking(currentTracking.id),
    repository.listRushesByTracking(currentTracking.id)
  ]);

  const activity = [
    creator.contractSignedAt
      ? {
          id: `contract-${creator.contractSignedAt}`,
          kind: "contract" as const,
          title: "Contrat signe",
          timestamp: creator.contractSignedAt,
          tone: "success" as const
        }
      : null,
    currentTracking.paidAt
      ? {
          id: `paid-${currentTracking.paidAt}`,
          kind: "paid" as const,
          title: "Paiement effectue",
          timestamp: currentTracking.paidAt,
          tone: "success" as const
        }
      : null,
    ...uploadedVideos.flatMap((video) => {
      const label = VIDEO_TYPE_LABELS[video.videoType];
      const items: CreatorDashboardData["activity"] = [
        {
          id: `upload-${video.id}`,
          kind: "upload" as const,
          title: `Upload ${label}`,
          detail: `${video.durationSeconds}s • ${video.resolution}`,
          timestamp: video.createdAt,
          tone: "neutral" as const
        }
      ];

      if (video.reviewedAt) {
        if (video.status === "approved") {
          items.push({
            id: `approved-${video.id}`,
            kind: "approved" as const,
            title: `Valide: ${label}`,
            timestamp: video.reviewedAt,
            tone: "success" as const
          });
        }

        if (video.status === "rejected") {
          items.push({
            id: `rejected-${video.id}`,
            kind: "rejected" as const,
            title: `Refusé : ${label}`,
            detail: video.rejectionReason ?? undefined,
            timestamp: video.reviewedAt,
            tone: "warning" as const
          });
        }

        if (video.status === "revision_requested") {
          items.push({
            id: `revision-${video.id}`,
            kind: "revision_requested" as const,
            title: `Révision demandée : ${label}`,
            detail: video.rejectionReason ?? undefined,
            timestamp: video.reviewedAt,
            tone: "warning" as const
          });
        }
      }

      return items;
    }),
    ...rushes.map((rush) => ({
      id: `rush-${rush.id}`,
      kind: "rush" as const,
      title: `Rush: ${rush.fileName}`,
      detail: `${rush.fileSizeMb}MB`,
      timestamp: rush.createdAt,
      tone: "neutral" as const
    }))
  ]
    .filter(Boolean)
    .sort((a, b) => b!.timestamp.localeCompare(a!.timestamp))
    .slice(0, 12) as CreatorDashboardData["activity"];

  const paymentHistory = allTrackings.map((tracking) => {
    const trackingSummary = summarizeTracking(tracking.delivered);
    const trackingPayout = calculatePayout(tracking.delivered, rates);

    return {
      month: tracking.month,
      deliveredTotal: trackingSummary.deliveredTotal,
      paymentStatus: PAYMENT_STATUS_LABELS[tracking.paymentStatus],
      amount: trackingPayout.total,
      paidAt: tracking.paidAt
    };
  });

  return {
    creator: {
      id: creator.id,
      handle: creator.handle,
      displayName: creator.displayName,
      country: creator.country,
      status: creator.status,
      contractSignedAt: creator.contractSignedAt,
      kitPromoCode: creator.kitPromoCode,
      kitOrderPlacedAt: creator.kitOrderPlacedAt,
      kitStatus: deriveKitStatusForCreator(creator)
    },
    month: currentTracking.month,
    progress: {
      deliveredTotal: summary.deliveredTotal,
      estimatedPayout: payout.total
    },
    deliveredByType,
    payoutBreakdown: payout.items
      .filter((item) => activeVideoTypes.has(item.key))
      .map((item) => ({
        key: item.key,
        label: VIDEO_TYPE_LABELS[item.key],
        delivered: item.delivered,
        rate: item.rate,
        subtotal: item.subtotal
      })),
    upload: {
      monthlyTrackingId: currentTracking.id,
      ratesByType: rates
        .filter((rate) => !rate.isPlaceholder)
        .map((rate) => ({
          videoType: rate.videoType,
          label: VIDEO_TYPE_LABELS[rate.videoType],
          ratePerVideo: rate.ratePerVideo
        })),
      specs: [
        "Formats preferes: MP4, MOV (autres formats videos acceptes)",
        "Resolution recommandee: 1080x1920 (9:16) ou 1080x1080 (1:1)",
        "Duree recommandee: 15 a 60 secondes",
        "Taille recommandee: <= 500MB"
      ],
      tips: {
        OOTD: ["Plan stable miroir ou face cam", "Lumi\u00e8re naturelle de pr\u00e9f\u00e9rence"],
        TRAINING: [
          "Angle qui montre le mouvement complet",
          "Son ambiant OK, on g\u00e8re le montage"
        ],
        BEFORE_AFTER: [
          "\u00c9tat initial clair et bien \u00e9clair\u00e9",
          "Transition nette entre avant et apr\u00e8s"
        ],
        SPORTS_80S: ["Styling r\u00e9tro muscle", "Background gym old-school"],
        CINEMATIC: [
          "Cadrage soign\u00e9, lumi\u00e8re travaill\u00e9e",
          "Ambiance forte, on s\u2019occupe du reste"
        ]
      },
      pendingReviewCount: uploadedVideos.filter((video) => video.status === "pending_review")
        .length,
      revisionCount: uploadedVideos.filter(
        (video) => video.status === "revision_requested" && !video.supersededBy
      ).length,
      rejectedCount: uploadedVideos.filter((video) => video.status === "rejected").length,
      recentVideos: uploadedVideos.filter((video) => !video.supersededBy).slice(0, 8).map((video) => ({
        id: video.id,
        videoType: video.videoType,
        status: video.status,
        createdAt: video.createdAt,
        fileUrl: video.fileUrl,
        rejectionReason: video.rejectionReason,
        supersededBy: video.supersededBy
      }))
    },
    rushes: {
      totalFiles: rushes.length,
      totalSizeMb: rushes.reduce((sum, rush) => sum + rush.fileSizeMb, 0),
      recentRushes: rushes.slice(0, 10).map((rush) => ({
        id: rush.id,
        fileName: rush.fileName,
        fileSizeMb: rush.fileSizeMb,
        fileUrl: rush.fileUrl,
        createdAt: rush.createdAt
      }))
    },
    activity,
    paymentHistory,
    hasPayoutProfile: payoutProfile !== null
  };
}
