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

export interface CreatorRepository {
  listCreators(): Promise<Creator[]>;
  getCreatorById(creatorId: string): Promise<Creator | null>;

  listMonthlyTrackings(month?: string): Promise<MonthlyTracking[]>;
  getMonthlyTracking(creatorId: string, month: string): Promise<MonthlyTracking | null>;
  getMonthlyTrackingById(monthlyTrackingId: string): Promise<MonthlyTracking | null>;
  listCreatorTrackings(creatorId: string): Promise<MonthlyTracking[]>;

  getVideoById(videoId: string): Promise<VideoAsset | null>;
  listVideosByStatus(status: VideoStatus): Promise<VideoAsset[]>;
  listVideosByTracking(monthlyTrackingId: string): Promise<VideoAsset[]>;
  listAllVideos(filters?: {
    status?: VideoStatus;
    creatorId?: string;
    videoType?: VideoType;
  }): Promise<VideoAsset[]>;
  listRushesByTracking(monthlyTrackingId: string): Promise<RushAsset[]>;
  createRushAsset(input: {
    monthlyTrackingId: string;
    creatorId: string;
    fileName: string;
    fileSizeMb: number;
    fileUrl?: string | null;
  }): Promise<RushAsset>;
  createVideoAsset(input: {
    monthlyTrackingId: string;
    creatorId: string;
    videoType: VideoAsset["videoType"];
    fileUrl: string;
    durationSeconds: number;
    resolution: VideoAsset["resolution"];
    fileSizeMb: number;
    status?: VideoStatus;
    supersededBy?: string;
  }): Promise<VideoAsset>;
  /**
   * Set superseded_by on a video to record that another video replaced it.
   * Called non-fatally after creating the revision replacement video.
   *
   * SECURITY: This method performs NO ownership or status checks — it is the
   * caller's responsibility (use-case layer) to verify:
   *   1. videoId.creatorId === authenticated creator
   *   2. videoId.status === "revision_requested"
   *   3. videoId.supersededBy is currently null (idempotency)
   *   4. supersededById belongs to the same creator and monthlyTrackingId
   */
  markVideoSuperseded(input: {
    videoId: string;
    supersededById: string;
  }): Promise<VideoAsset>;
  reviewVideoAsset(input: {
    videoId: string;
    status: Extract<VideoStatus, "approved" | "rejected" | "revision_requested">;
    rejectionReason?: string | null;
    reviewedBy: string;
  }): Promise<VideoAsset>;
  /** Atomically review a video and recalculate tracking delivered counts. */
  reviewVideoAndUpdateTracking(input: {
    videoId: string;
    status: Extract<VideoStatus, "approved" | "rejected" | "revision_requested">;
    rejectionReason?: string | null;
    reviewedBy: string;
  }): Promise<{ video: VideoAsset; tracking: MonthlyTracking }>;
  updateTrackingDelivered(input: {
    monthlyTrackingId: string;
    delivered: MonthlyTracking["delivered"];
  }): Promise<MonthlyTracking>;
  markMonthlyTrackingPaid(input: {
    monthlyTrackingId: string;
    paidAt?: string | null;
    paidAmount?: number | null;
  }): Promise<MonthlyTracking>;

  listRates(): Promise<VideoRate[]>;

  updateVideoRate(input: {
    videoType: VideoRate["videoType"];
    ratePerVideo: number;
  }): Promise<VideoRate>;

  deleteVideoRate(input: { videoType: VideoRate["videoType"] }): Promise<VideoRate>;

  // Creator payout details (creator-facing + admin views)
  getPayoutProfileByCreatorId(creatorId: string): Promise<CreatorPayoutProfile | null>;
  /** Fetch all payout profiles in a single query (avoids N+1). */
  listPayoutProfiles(): Promise<CreatorPayoutProfile[]>;
  upsertPayoutProfile(input: {
    creatorId: string;
    method: CreatorPayoutProfile["method"];
    accountHolderName?: string | null;
    iban?: string | null;
    paypalEmail?: string | null;
  }): Promise<CreatorPayoutProfile>;

  // Contract signatures (creator + admin views)
  listContractSignaturesByCreatorId(creatorId: string): Promise<CreatorContractSignature[]>;

  // Applications (creator self-serve + admin)
  listCreatorApplications(status?: ApplicationStatus): Promise<CreatorApplication[]>;
  getCreatorApplicationByUserId(userId: string): Promise<CreatorApplication | null>;
  upsertCreatorApplication(input: {
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
  }): Promise<CreatorApplication>;
  reviewCreatorApplication(input: {
    userId: string;
    status: Exclude<ApplicationStatus, "draft" | "pending_review">;
    reviewNotes?: string | null;
  }): Promise<CreatorApplication>;

  // Creator provisioning (admin-facing)
  getCreatorByUserId(userId: string): Promise<Creator | null>;
  updateCreatorStatus(input: {
    creatorId: string;
    status: Extract<Creator["status"], "actif" | "pause" | "inactif">;
  }): Promise<Creator>;
  upsertCreatorFromApplication(input: {
    application: CreatorApplication;
    status: "actif" | "candidat";
    startDate: string; // YYYY-MM-DD
  }): Promise<Creator>;

  createMonthlyTracking(input: {
    creatorId: string;
    month: string; // YYYY-MM
    delivered: MonthlyTracking["delivered"];
  }): Promise<MonthlyTracking>;

  // Contract signing (self-serve creator)
  /**
   * Atomically record a signature row and set `contract_signed_at` on the creator.
   * Idempotent on `(user_id, contract_checksum)` — signing the same contract twice
   * returns the original signature metadata and `wasFirstTimeSigning: false`.
   */
  signContract(input: {
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
  }>;

  // Shopify kit promo code integration
  /** Look up a creator by their generated Shopify promo code (case-insensitive). */
  getCreatorByKitPromoCode(code: string): Promise<Creator | null>;
  /** Store the generated Shopify discount code + id on the creator row. */
  updateKitPromoCode(input: {
    creatorId: string;
    kitPromoCode: string;
    shopifyDiscountId: string;
  }): Promise<Creator>;
  /** Null out the kit promo code fields so a fresh one can be generated. Admin-only rotate path. */
  clearKitPromoCode(creatorId: string): Promise<Creator>;
  /** Mark the creator's kit order as placed. Called from the orders/create webhook. */
  markKitOrdered(input: {
    creatorId: string;
    kitOrderPlacedAt: string;
    shopifyKitOrderId: string;
    orderAmount?: number | null;
    orderCurrency?: string | null;
  }): Promise<Creator>;
  /**
   * Atomically record a Shopify webhook delivery for dedupe.
   * Returns true if this is the first time we see this webhookId, false otherwise.
   */
  recordShopifyWebhookOnce(input: {
    webhookId: string;
    topic: string;
    shopDomain?: string | null;
    creatorId?: string | null;
  }): Promise<boolean>;
  /** Remove a recorded webhook event when downstream processing fails, so retries can proceed. */
  rollbackShopifyWebhook(webhookId: string): Promise<void>;

  // ── Batch submissions ──────────────────────────────────────────────────────
  createBatchSubmission(input: {
    monthlyTrackingId: string;
    creatorId: string;
    videoType: VideoType;
    minClipsRequired: number;
  }): Promise<BatchSubmission>;
  getBatchSubmissionById(batchId: string): Promise<BatchSubmission | null>;
  /** Insert a clip row linked to a batch. Status is always "uploaded" — clips are never individually reviewed. */
  addClipToBatch(input: {
    batchSubmissionId: string;
    monthlyTrackingId: string;
    creatorId: string;
    videoType: VideoType;
    fileUrl: string;
    fileSizeMb: number;
    durationSeconds?: number;
    resolution?: string;
  }): Promise<VideoAsset>;
  listClipsByBatch(batchId: string): Promise<VideoAsset[]>;
  listBatchSubmissionsByStatus(status: VideoStatus): Promise<BatchSubmission[]>;
  listBatchSubmissionsByTracking(monthlyTrackingId: string): Promise<BatchSubmission[]>;
  /** Delete a batch submission row (used for compensating rollback on partial clip insert failure). */
  deleteBatchSubmission(batchId: string): Promise<void>;
  /** Atomically review a batch and increment delivered[videoType] by 1 when approved. */
  reviewBatchAndUpdateTracking(input: {
    batchId: string;
    status: Extract<VideoStatus, "approved" | "rejected" | "revision_requested">;
    rejectionReason?: string | null;
    reviewedBy: string;
  }): Promise<{ batch: BatchSubmission; tracking: MonthlyTracking }>;
}
