import { notFound } from "next/navigation";

import { getRepository } from "@/application/dependencies";
import { PAYMENT_STATUS_LABELS, VIDEO_TYPE_LABELS } from "@/domain/constants/labels";
import { calculatePayout } from "@/domain/services/calculate-payout";
import { deriveKitStatusForCreator } from "@/domain/services/derive-kit-status";
import { summarizeTracking } from "@/domain/services/tracking-summary";
import { VIDEO_TYPES, type CreatorKitStatus } from "@/domain/types";
import { resolveMonth } from "@/application/use-cases/shared";

export interface AdminCreatorDetailData {
  creator: {
    id: string;
    handle: string;
    displayName: string;
    email: string;
    whatsapp: string;
    country: string;
    address: string;
    followersTiktok: number;
    followersInstagram: number;
    status: string;
    contractSignedAt?: string;
    notes?: string;
    kitPromoCode?: string | null;
    kitOrderPlacedAt?: string | null;
    kitStatus: CreatorKitStatus;
  };
  payoutProfile: {
    method: string;
    accountHolderName?: string | null;
    iban?: string | null;
    paypalEmail?: string | null;
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
    deliveredTotal: number;
    paymentStatus: string;
    paymentStatusKey: string;
    paidAt?: string;
    payoutAmount: number;
    delivered: Record<string, number>;
  }>;
  selectedMonth: string;
  availableMonths: string[];
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

export async function getAdminCreatorDetailData(input: {
  creatorId: string;
  month?: string;
}): Promise<AdminCreatorDetailData> {
  const repository = getRepository();
  const [creator, trackings, rates] = await Promise.all([
    repository.getCreatorById(input.creatorId),
    repository.listCreatorTrackings(input.creatorId),
    repository.listRates()
  ]);

  if (!creator) {
    notFound();
  }

  const signatures = await repository.listContractSignaturesByCreatorId(creator.id);
  const payoutProfile = await repository.getPayoutProfileByCreatorId(creator.id);

  const trackingsRows = trackings.map((tracking) => {
    const summary = summarizeTracking(tracking.delivered);
    const payout = calculatePayout(tracking.delivered, rates);

    return {
      id: tracking.id,
      month: tracking.month,
      deliveredTotal: summary.deliveredTotal,
      paymentStatus: PAYMENT_STATUS_LABELS[tracking.paymentStatus],
      paymentStatusKey: tracking.paymentStatus,
      paidAt: tracking.paidAt,
      payoutAmount: payout.total,
      delivered: Object.fromEntries(
        VIDEO_TYPES.map((videoType) => [
          VIDEO_TYPE_LABELS[videoType],
          tracking.delivered[videoType]
        ])
      )
    };
  });

  const availableMonths = [...trackings.map((t) => t.month)].sort((a, b) => b.localeCompare(a));
  const selectedMonth = resolveMonth(
    input.month,
    trackings.map((t) => t.month)
  );

  const currentTracking = trackings.find((t) => t.month === selectedMonth) ?? trackings[0] ?? null;
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
      followersTiktok: creator.followersTiktok,
      followersInstagram: creator.followersInstagram,
      status: creator.status,
      contractSignedAt: creator.contractSignedAt,
      notes: creator.notes,
      kitPromoCode: creator.kitPromoCode ?? null,
      kitOrderPlacedAt: creator.kitOrderPlacedAt ?? null,
      kitStatus: deriveKitStatusForCreator(creator)
    },
    payoutProfile: payoutProfile
      ? {
          method: payoutProfile.method,
          accountHolderName: payoutProfile.accountHolderName ?? null,
          iban: payoutProfile.iban ?? null,
          paypalEmail: payoutProfile.paypalEmail ?? null,
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
    selectedMonth,
    availableMonths,
    currentMonth: currentTracking
      ? {
          trackingId: currentTracking.id,
          videos: currentVideos.map((video) => ({
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
          rushes: currentRushes.map((rush) => ({
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
