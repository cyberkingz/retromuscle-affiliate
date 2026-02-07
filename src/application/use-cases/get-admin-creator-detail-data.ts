import { getRepository } from "@/application/dependencies";
import { MIX_LABELS, PAYMENT_STATUS_LABELS, VIDEO_TYPE_LABELS } from "@/domain/constants/labels";
import { calculatePayout } from "@/domain/services/calculate-payout";
import { summarizeTracking } from "@/domain/services/tracking-summary";
import { VIDEO_TYPES } from "@/domain/types";

export interface AdminCreatorDetailData {
  creator: {
    id: string;
    handle: string;
    displayName: string;
    email: string;
    whatsapp: string;
    country: string;
    address: string;
    followers: number;
    status: string;
    packageTier: number;
    defaultMix: string;
    contractSignedAt?: string;
    notes?: string;
  };
  payoutProfile: {
    method: string;
    accountHolderName?: string | null;
    iban?: string | null;
    paypalEmail?: string | null;
    stripeAccount?: string | null;
    updatedAt: string;
  } | null;
  contract: {
    signedAt?: string;
    signatures: Array<{
      id: string;
      contractVersion: string;
      signerName: string;
      signedAt: string;
      ip?: string | null;
    }>;
  };
  trackings: Array<{
    id: string;
    month: string;
    packageTier: number;
    mixLabel: string;
    deliveredTotal: number;
    quotaTotal: number;
    remainingTotal: number;
    deadline: string;
    paymentStatus: string;
    paymentStatusKey: string;
    paidAt?: string;
    payoutAmount: number;
    quotas: Record<string, number>;
    delivered: Record<string, number>;
  }>;
  currentMonth: {
    trackingId: string;
    videos: Array<{
      id: string;
      videoType: string;
      status: string;
      fileUrl: string;
      createdAt: string;
      rejectionReason?: string;
      durationSeconds: number;
      resolution: string;
      fileSizeMb: number;
    }>;
    rushes: Array<{
      id: string;
      fileName: string;
      fileUrl?: string;
      fileSizeMb: number;
      createdAt: string;
    }>;
  } | null;
}

export async function getAdminCreatorDetailData(input: { creatorId: string }): Promise<AdminCreatorDetailData> {
  const repository = getRepository();
  const [creator, trackings, rates, packages] = await Promise.all([
    repository.getCreatorById(input.creatorId),
    repository.listCreatorTrackings(input.creatorId),
    repository.listRates(),
    repository.listPackageDefinitions()
  ]);

  if (!creator) {
    throw new Error("Creator not found");
  }

  const packageByTier = new Map(packages.map((pkg) => [pkg.tier, pkg]));
  const signatures = await repository.listContractSignaturesByCreatorId(creator.id);
  const payoutProfile = await repository.getPayoutProfileByCreatorId(creator.id);

  const trackingsRows = trackings.map((tracking) => {
    const pkg = packageByTier.get(tracking.packageTier);
    if (!pkg) {
      throw new Error(`Package not found for tracking ${tracking.id}`);
    }

    const summary = summarizeTracking(tracking.quotas, tracking.delivered);
    const payout = calculatePayout(tracking.delivered, rates, pkg.monthlyCredits);

    return {
      id: tracking.id,
      month: tracking.month,
      packageTier: tracking.packageTier,
      mixLabel: MIX_LABELS[tracking.mixName],
      deliveredTotal: summary.deliveredTotal,
      quotaTotal: tracking.quotaTotal,
      remainingTotal: summary.remainingTotal,
      deadline: tracking.deadline,
      paymentStatus: PAYMENT_STATUS_LABELS[tracking.paymentStatus],
      paymentStatusKey: tracking.paymentStatus,
      paidAt: tracking.paidAt,
      payoutAmount: payout.total,
      quotas: Object.fromEntries(
        VIDEO_TYPES.map((videoType) => [VIDEO_TYPE_LABELS[videoType], tracking.quotas[videoType]])
      ),
      delivered: Object.fromEntries(
        VIDEO_TYPES.map((videoType) => [VIDEO_TYPE_LABELS[videoType], tracking.delivered[videoType]])
      )
    };
  });

  const currentTracking = trackings[0] ?? null;
  const [currentVideos, currentRushes] = currentTracking
    ? await Promise.all([
        repository.listVideosByTracking(currentTracking.id),
        repository.listRushesByTracking(currentTracking.id)
      ])
    : [[], []];

  return {
    creator: {
      id: creator.id,
      handle: creator.handle,
      displayName: creator.displayName,
      email: creator.email,
      whatsapp: creator.whatsapp,
      country: creator.country,
      address: creator.address,
      followers: creator.followers,
      status: creator.status,
      packageTier: creator.packageTier,
      defaultMix: creator.defaultMix,
      contractSignedAt: creator.contractSignedAt,
      notes: creator.notes
    },
    payoutProfile: payoutProfile
      ? {
          method: payoutProfile.method,
          accountHolderName: payoutProfile.accountHolderName ?? null,
          iban: payoutProfile.iban ?? null,
          paypalEmail: payoutProfile.paypalEmail ?? null,
          stripeAccount: payoutProfile.stripeAccount ?? null,
          updatedAt: payoutProfile.updatedAt
        }
      : null,
    contract: {
      signedAt: creator.contractSignedAt,
      signatures: signatures.map((signature) => ({
        id: signature.id,
        contractVersion: signature.contractVersion,
        signerName: signature.signerName,
        signedAt: signature.signedAt,
        ip: signature.ip ?? null
      }))
    },
    trackings: trackingsRows,
    currentMonth: currentTracking
      ? {
          trackingId: currentTracking.id,
          videos: currentVideos.slice(0, 16).map((video) => ({
            id: video.id,
            videoType: VIDEO_TYPE_LABELS[video.videoType],
            status: video.status,
            fileUrl: video.fileUrl,
            createdAt: video.createdAt,
            rejectionReason: video.rejectionReason,
            durationSeconds: video.durationSeconds,
            resolution: video.resolution,
            fileSizeMb: video.fileSizeMb
          })),
          rushes: currentRushes.slice(0, 12).map((rush) => ({
            id: rush.id,
            fileName: rush.fileName,
            fileUrl: rush.fileUrl,
            fileSizeMb: rush.fileSizeMb,
            createdAt: rush.createdAt
          }))
        }
      : null
  };
}

