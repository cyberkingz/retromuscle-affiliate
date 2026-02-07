import { getRepository } from "@/application/dependencies";
import { MIX_LABELS, PAYMENT_STATUS_LABELS, VIDEO_TYPE_LABELS } from "@/domain/constants/labels";
import { calculatePayout } from "@/domain/services/calculate-payout";
import { summarizeTracking } from "@/domain/services/tracking-summary";
import { VIDEO_TYPES, type VideoType } from "@/domain/types";
import { clampPercent } from "@/lib/progress";
import { resolveMonth } from "@/application/use-cases/shared";

export interface CreatorDashboardData {
  creator: {
    id: string;
    handle: string;
    displayName: string;
    country: string;
    status: string;
  };
  month: string;
  plan: {
    packageTier: number;
    mixName: string;
    mixLabel: string;
    monthlyCredits: number;
    deadline: string;
  };
  progress: {
    deliveredTotal: number;
    quotaTotal: number;
    completionPercent: number;
    remainingTotal: number;
    remainingDetails: string;
    estimatedPayout: number;
  };
  quotasByType: Array<{
    key: string;
    label: string;
    required: number;
    delivered: number;
    remaining: number;
    completionPercent: number;
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
    specs: string[];
    tips: Record<string, string[]>;
    pendingReviewCount: number;
    rejectedCount: number;
    recentVideos: Array<{
      id: string;
      videoType: VideoType;
      status: string;
      createdAt: string;
      fileUrl: string;
      rejectionReason?: string;
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
    kind: "upload" | "approved" | "rejected" | "rush" | "paid" | "contract";
    title: string;
    detail?: string;
    timestamp: string;
    tone: "neutral" | "success" | "warning";
  }>;
  paymentHistory: Array<{
    month: string;
    deliveredTotal: number;
    quotaTotal: number;
    paymentStatus: string;
    amount: number;
    paidAt?: string;
  }>;
}

export async function getCreatorDashboardData(input: {
  creatorId?: string;
  month?: string;
}): Promise<CreatorDashboardData> {
  const repository = getRepository();
  const [creators, rates, packages] = await Promise.all([
    repository.listCreators(),
    repository.listRates(),
    repository.listPackageDefinitions()
  ]);

  const targetCreatorId = input.creatorId ?? creators[0]?.id;
  if (!targetCreatorId) {
    throw new Error("No creator found");
  }

  const [creator, trackings] = await Promise.all([
    repository.getCreatorById(targetCreatorId),
    repository.listCreatorTrackings(targetCreatorId)
  ]);

  if (!creator) {
    throw new Error(`Creator ${targetCreatorId} not found`);
  }

  const targetMonth = resolveMonth(
    input.month,
    trackings.map((tracking) => tracking.month)
  );

  const currentTracking =
    trackings.find((tracking) => tracking.month === targetMonth) ?? trackings[0] ?? null;

  if (!currentTracking) {
    throw new Error(`No monthly tracking found for creator ${creator.id}`);
  }

  const packageMap = new Map(packages.map((item) => [item.tier, item]));
  const packageDefinition = packageMap.get(currentTracking.packageTier);
  if (!packageDefinition) {
    throw new Error(`Missing package definition ${currentTracking.packageTier}`);
  }

  const summary = summarizeTracking(currentTracking.quotas, currentTracking.delivered);
  const payout = calculatePayout(
    currentTracking.delivered,
    rates,
    packageDefinition.monthlyCredits
  );

  const quotaByType = VIDEO_TYPES.map((videoType) => {
    const required = currentTracking.quotas[videoType];
    const delivered = currentTracking.delivered[videoType];
    return {
      key: videoType,
      label: VIDEO_TYPE_LABELS[videoType],
      required,
      delivered,
      remaining: Math.max(required - delivered, 0),
      completionPercent: clampPercent(delivered, required)
    };
  });

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
            title: `Rejete: ${label}`,
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

  const paymentHistory = trackings.map((tracking) => {
    const pkg = packageMap.get(tracking.packageTier);
    if (!pkg) {
      throw new Error(`Missing package for tracking ${tracking.id}`);
    }

    const trackingSummary = summarizeTracking(tracking.quotas, tracking.delivered);
    const trackingPayout = calculatePayout(tracking.delivered, rates, pkg.monthlyCredits);

    return {
      month: tracking.month,
      deliveredTotal: trackingSummary.deliveredTotal,
      quotaTotal: tracking.quotaTotal,
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
      status: creator.status
    },
    month: currentTracking.month,
    plan: {
      packageTier: currentTracking.packageTier,
      mixName: currentTracking.mixName,
      mixLabel: MIX_LABELS[currentTracking.mixName],
      monthlyCredits: packageDefinition.monthlyCredits,
      deadline: currentTracking.deadline
    },
    progress: {
      deliveredTotal: summary.deliveredTotal,
      quotaTotal: currentTracking.quotaTotal,
      completionPercent: clampPercent(summary.deliveredTotal, currentTracking.quotaTotal),
      remainingTotal: summary.remainingTotal,
      remainingDetails: summary.remainingDetails,
      estimatedPayout: payout.total
    },
    quotasByType: quotaByType,
    payoutBreakdown: payout.items.map((item) => ({
      key: item.key,
      label: VIDEO_TYPE_LABELS[item.key as keyof typeof VIDEO_TYPE_LABELS],
      delivered: item.delivered,
      rate: item.rate,
      subtotal: item.subtotal
    })),
    upload: {
      monthlyTrackingId: currentTracking.id,
      specs: [
        "Formats: MP4, MOV",
        "Resolution: 1080x1920 (9:16) ou 1080x1080 (1:1)",
        "Duree: 15 a 60 secondes",
        "Taille max: 500MB"
      ],
      tips: {
        OOTD: ["Plan stable miroir ou face cam", "Hook dans les 2 premieres secondes"],
        TRAINING: ["Mouvement principal dans la premiere moitie", "Sous-titres lisibles"],
        BEFORE_AFTER: ["Etat initial clair", "Narration progression en 3 actes"],
        SPORTS_80S: ["Styling retro muscle", "Background gym old-school"],
        CINEMATIC: ["Direction artistique soignee", "Color grading propre", "Montage dynamique"]
      },
      pendingReviewCount: uploadedVideos.filter((video) => video.status === "pending_review").length,
      rejectedCount: uploadedVideos.filter((video) => video.status === "rejected").length,
      recentVideos: uploadedVideos.slice(0, 8).map((video) => ({
        id: video.id,
        videoType: video.videoType,
        status: video.status,
        createdAt: video.createdAt,
        fileUrl: video.fileUrl,
        rejectionReason: video.rejectionReason
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
    paymentHistory
  };
}
