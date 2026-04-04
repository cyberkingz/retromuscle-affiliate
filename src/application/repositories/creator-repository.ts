import type {
  ApplicationStatus,
  Creator,
  CreatorApplication,
  CreatorContractSignature,
  CreatorPayoutProfile,
  MonthlyTracking,
  RushAsset,
  VideoAsset,
  VideoRate,
  VideoStatus
} from "@/domain/types";

export interface CreatorRepository {
  listCreators(): Promise<Creator[]>;
  getCreatorById(creatorId: string): Promise<Creator | null>;

  listMonthlyTrackings(month?: string): Promise<MonthlyTracking[]>;
  getMonthlyTracking(creatorId: string, month: string): Promise<MonthlyTracking | null>;
  getMonthlyTrackingById(monthlyTrackingId: string): Promise<MonthlyTracking | null>;
  listCreatorTrackings(creatorId: string): Promise<MonthlyTracking[]>;

  listVideosByStatus(status: VideoStatus): Promise<VideoAsset[]>;
  listVideosByTracking(monthlyTrackingId: string): Promise<VideoAsset[]>;
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
  }): Promise<VideoAsset>;
  reviewVideoAsset(input: {
    videoId: string;
    status: Extract<VideoStatus, "approved" | "rejected">;
    rejectionReason?: string | null;
    reviewedBy: string;
  }): Promise<VideoAsset>;
  /** Atomically review a video and recalculate tracking delivered counts. */
  reviewVideoAndUpdateTracking(input: {
    videoId: string;
    status: Extract<VideoStatus, "approved" | "rejected">;
    rejectionReason?: string | null;
    reviewedBy: string;
  }): Promise<{ video: VideoAsset; tracking: MonthlyTracking }>;
  updateTrackingDelivered(input: {
    monthlyTrackingId: string;
    delivered: MonthlyTracking["delivered"];
  }): Promise<MonthlyTracking>;
  markMonthlyTrackingPaid(input: { monthlyTrackingId: string; paidAt?: string | null }): Promise<MonthlyTracking>;

  listRates(): Promise<VideoRate[]>;

  updateVideoRate(input: {
    videoType: VideoRate["videoType"];
    ratePerVideo: number;
  }): Promise<VideoRate>;

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
    stripeAccount?: string | null;
  }): Promise<CreatorPayoutProfile>;

  // Contract signatures (creator + admin views)
  listContractSignaturesByCreatorId(creatorId: string): Promise<CreatorContractSignature[]>;

  // Applications (admin-facing)
  listCreatorApplications(status?: ApplicationStatus): Promise<CreatorApplication[]>;
  getCreatorApplicationByUserId(userId: string): Promise<CreatorApplication | null>;
  reviewCreatorApplication(input: {
    userId: string;
    status: Exclude<ApplicationStatus, "draft" | "pending_review">;
    reviewNotes?: string | null;
  }): Promise<CreatorApplication>;

  // Creator provisioning (admin-facing)
  getCreatorByUserId(userId: string): Promise<Creator | null>;
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
}
