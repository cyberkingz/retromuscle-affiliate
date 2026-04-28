import { creators, monthlyTrackings, rushes, videos, references } from "@/data/mock-db";
import type {
  ApplicationStatus,
  BatchSubmission,
  Creator,
  CreatorApplication,
  CreatorContractSignature,
  CreatorPayoutProfile,
  MonthlyTracking,
  RushAsset,
  VideoAsset,
  VideoRate,
  VideoStatus,
  VideoType
} from "@/domain/types";

import type { CreatorRepository } from "@/application/repositories/creator-repository";

function byMonthDesc(a: MonthlyTracking, b: MonthlyTracking): number {
  return b.month.localeCompare(a.month);
}

export class InMemoryCreatorRepository implements CreatorRepository {
  async listCreators(): Promise<Creator[]> {
    return creators;
  }

  async getCreatorById(creatorId: string): Promise<Creator | null> {
    return creators.find((creator) => creator.id === creatorId) ?? null;
  }

  async listMonthlyTrackings(month?: string): Promise<MonthlyTracking[]> {
    if (!month) {
      return [...monthlyTrackings].sort(byMonthDesc);
    }
    return monthlyTrackings.filter((tracking) => tracking.month === month).sort(byMonthDesc);
  }

  async getMonthlyTracking(creatorId: string, month: string): Promise<MonthlyTracking | null> {
    return (
      monthlyTrackings.find(
        (tracking) => tracking.creatorId === creatorId && tracking.month === month
      ) ?? null
    );
  }

  async getMonthlyTrackingById(monthlyTrackingId: string): Promise<MonthlyTracking | null> {
    return monthlyTrackings.find((tracking) => tracking.id === monthlyTrackingId) ?? null;
  }

  async listCreatorTrackings(creatorId: string): Promise<MonthlyTracking[]> {
    return monthlyTrackings
      .filter((tracking) => tracking.creatorId === creatorId)
      .sort(byMonthDesc);
  }

  async getVideoById(videoId: string): Promise<VideoAsset | null> {
    return videos.find((v) => v.id === videoId) ?? null;
  }

  async listVideosByStatus(status: VideoStatus): Promise<VideoAsset[]> {
    return videos.filter((video) => video.status === status);
  }

  async listVideosByTracking(monthlyTrackingId: string): Promise<VideoAsset[]> {
    return videos.filter((video) => video.monthlyTrackingId === monthlyTrackingId);
  }

  async listAllVideos(filters?: {
    status?: VideoStatus;
    creatorId?: string;
    videoType?: import("@/domain/types").VideoType;
  }): Promise<VideoAsset[]> {
    return videos.filter((video) => {
      if (filters?.status && video.status !== filters.status) return false;
      if (filters?.creatorId && video.creatorId !== filters.creatorId) return false;
      if (filters?.videoType && video.videoType !== filters.videoType) return false;
      return true;
    });
  }

  async listRushesByTracking(monthlyTrackingId: string): Promise<RushAsset[]> {
    return rushes.filter((item) => item.monthlyTrackingId === monthlyTrackingId);
  }

  async createRushAsset(_input: {
    monthlyTrackingId: string;
    creatorId: string;
    fileName: string;
    fileSizeMb: number;
    fileUrl?: string | null;
  }): Promise<RushAsset> {
    throw new Error("Rush uploads are not available in offline mode");
  }

  async createVideoAsset(_input: {
    monthlyTrackingId: string;
    creatorId: string;
    videoType: VideoAsset["videoType"];
    fileUrl: string;
    durationSeconds: number;
    resolution: VideoAsset["resolution"];
    fileSizeMb: number;
    status?: VideoStatus;
    supersededBy?: string;
  }): Promise<VideoAsset> {
    throw new Error("Uploads are not available in offline mode");
  }

  async markVideoSuperseded(_input: {
    videoId: string;
    supersededById: string;
  }): Promise<VideoAsset> {
    throw new Error("Video versioning is not available in offline mode");
  }

  async reviewVideoAsset(_input: {
    videoId: string;
    status: Extract<VideoStatus, "approved" | "rejected" | "revision_requested">;
    rejectionReason?: string | null;
    reviewedBy: string;
  }): Promise<VideoAsset> {
    throw new Error("Video review is not available in offline mode");
  }

  async reviewVideoAndUpdateTracking(_input: {
    videoId: string;
    status: Extract<VideoStatus, "approved" | "rejected" | "revision_requested">;
    rejectionReason?: string | null;
    reviewedBy: string;
  }): Promise<{ video: VideoAsset; tracking: MonthlyTracking }> {
    throw new Error("Atomic video review is not available in offline mode");
  }

  async updateTrackingDelivered(_input: {
    monthlyTrackingId: string;
    delivered: MonthlyTracking["delivered"];
  }): Promise<MonthlyTracking> {
    throw new Error("Tracking updates are not available in offline mode");
  }

  async markMonthlyTrackingPaid(_input: {
    monthlyTrackingId: string;
    paidAt?: string | null;
  }): Promise<MonthlyTracking> {
    throw new Error("Payments are not available in offline mode");
  }

  async listRates(): Promise<VideoRate[]> {
    return references.rates;
  }

  async updateVideoRate(_input: {
    videoType: VideoRate["videoType"];
    ratePerVideo: number;
  }): Promise<VideoRate> {
    throw new Error("Config updates are not available in offline mode");
  }

  async deleteVideoRate(_input: { videoType: VideoRate["videoType"] }): Promise<VideoRate> {
    throw new Error("Config updates are not available in offline mode");
  }

  async getPayoutProfileByCreatorId(_creatorId: string): Promise<CreatorPayoutProfile | null> {
    return null;
  }

  async listPayoutProfiles(): Promise<CreatorPayoutProfile[]> {
    return [];
  }

  async upsertPayoutProfile(_input: {
    creatorId: string;
    method: CreatorPayoutProfile["method"];
    accountHolderName?: string | null;
    iban?: string | null;
    paypalEmail?: string | null;
  }): Promise<CreatorPayoutProfile> {
    throw new Error("Payout settings are not available in offline mode");
  }

  async listContractSignaturesByCreatorId(_creatorId: string): Promise<CreatorContractSignature[]> {
    return [];
  }

  async listCreatorApplications(_status?: ApplicationStatus): Promise<CreatorApplication[]> {
    // The in-memory repository is only used for offline/demo rendering.
    // Applications are stored in Supabase in real environments.
    return [];
  }

  async getCreatorApplicationByUserId(_userId: string): Promise<CreatorApplication | null> {
    return null;
  }

  async upsertCreatorApplication(_input: {
    userId: string;
    handle: string;
    fullName: string;
    email: string;
    whatsapp: string;
    country: string;
    address: string;
    socialTiktok?: string;
    socialInstagram?: string;
    followersTiktok: number;
    followersInstagram: number;
    submit: boolean;
  }): Promise<CreatorApplication> {
    throw new Error("Creator applications are not available in offline mode");
  }

  async reviewCreatorApplication(_input: {
    userId: string;
    status: Exclude<ApplicationStatus, "draft" | "pending_review">;
    reviewNotes?: string | null;
  }): Promise<CreatorApplication> {
    throw new Error("Creator applications are not available in offline mode");
  }

  async getCreatorByUserId(_userId: string): Promise<Creator | null> {
    return null;
  }

  async updateCreatorStatus(_input: {
    creatorId: string;
    status: Extract<Creator["status"], "actif" | "pause" | "inactif">;
  }): Promise<Creator> {
    throw new Error("Status updates are not available in offline mode");
  }

  async upsertCreatorFromApplication(_input: {
    application: CreatorApplication;
    status: "actif" | "candidat";
    startDate: string;
  }): Promise<Creator> {
    throw new Error("Creator provisioning is not available in offline mode");
  }

  async createMonthlyTracking(_input: {
    creatorId: string;
    month: string;
    delivered: MonthlyTracking["delivered"];
  }): Promise<MonthlyTracking> {
    throw new Error("Tracking provisioning is not available in offline mode");
  }

  async getCreatorByKitPromoCode(code: string): Promise<Creator | null> {
    const normalized = code.trim().toUpperCase();
    return (
      creators.find((creator) => creator.kitPromoCode?.toUpperCase() === normalized) ?? null
    );
  }

  async updateKitPromoCode(_input: {
    creatorId: string;
    kitPromoCode: string;
    shopifyDiscountId: string;
  }): Promise<Creator> {
    throw new Error("Kit promo code updates are not available in offline mode");
  }

  async markKitOrdered(_input: {
    creatorId: string;
    kitOrderPlacedAt: string;
    shopifyKitOrderId: string;
    orderAmount?: number | null;
    orderCurrency?: string | null;
  }): Promise<Creator> {
    throw new Error("Kit order updates are not available in offline mode");
  }

  async recordShopifyWebhookOnce(_input: {
    webhookId: string;
    topic: string;
    shopDomain?: string | null;
    creatorId?: string | null;
  }): Promise<boolean> {
    throw new Error("Shopify webhooks are not available in offline mode");
  }

  async rollbackShopifyWebhook(_webhookId: string): Promise<void> {
    throw new Error("Shopify webhooks are not available in offline mode");
  }

  async signContract(_input: {
    creatorId: string;
    userId: string;
    contractVersion: string;
    contractChecksum: string;
    contractText: string;
    signerName: string;
    acceptance: Record<string, boolean>;
    ip: string | null;
    userAgent: string | null;
    signedAt: string;
  }): Promise<{
    signatureId: string;
    signedAt: string;
    contractSignedAt: string;
    wasFirstTimeSigning: boolean;
  }> {
    throw new Error("Contract signing is not available in offline mode");
  }

  async clearKitPromoCode(_creatorId: string): Promise<Creator> {
    throw new Error("Kit promo code updates are not available in offline mode");
  }

  // ── Batch submissions (stubs — not used in tests) ─────────────────────────

  async createBatchSubmission(_input: {
    monthlyTrackingId: string;
    creatorId: string;
    videoType: VideoType;
    minClipsRequired: number;
  }): Promise<BatchSubmission> {
    throw new Error("Batch submissions are not available in offline mode");
  }

  async getBatchSubmissionById(_batchId: string): Promise<BatchSubmission | null> {
    throw new Error("Batch submissions are not available in offline mode");
  }

  async addClipToBatch(_input: {
    batchSubmissionId: string;
    monthlyTrackingId: string;
    creatorId: string;
    videoType: VideoType;
    fileUrl: string;
    fileSizeMb: number;
    durationSeconds?: number;
    resolution?: string;
  }): Promise<VideoAsset> {
    throw new Error("Batch submissions are not available in offline mode");
  }

  async listClipsByBatch(batchId: string): Promise<VideoAsset[]> {
    return videos.filter((v) => v.batchSubmissionId === batchId);
  }

  async listBatchSubmissionsByStatus(_status: VideoStatus): Promise<BatchSubmission[]> {
    return [];
  }

  async listBatchSubmissionsByTracking(_monthlyTrackingId: string): Promise<BatchSubmission[]> {
    return [];
  }

  async reviewBatchAndUpdateTracking(_input: {
    batchId: string;
    status: Extract<VideoStatus, "approved" | "rejected" | "revision_requested">;
    rejectionReason?: string | null;
    reviewedBy: string;
  }): Promise<{ batch: BatchSubmission; tracking: MonthlyTracking }> {
    throw new Error("Batch submissions are not available in offline mode");
  }

  async deleteBatchSubmission(_batchId: string): Promise<void> {
    throw new Error("Batch submissions are not available in offline mode");
  }

  async triggerCfStreamIngest(_videoId: string, _fileKey: string): Promise<void> {
    // no-op in offline mode
  }
}
