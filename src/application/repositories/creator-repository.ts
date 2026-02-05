import type {
  ApplicationStatus,
  Creator,
  CreatorApplication,
  MixDefinition,
  MonthlyTracking,
  PackageDefinition,
  PackageTier,
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
  updateTrackingDelivered(input: {
    monthlyTrackingId: string;
    delivered: MonthlyTracking["delivered"];
  }): Promise<MonthlyTracking>;

  listRates(): Promise<VideoRate[]>;
  listPackageDefinitions(): Promise<PackageDefinition[]>;
  listMixDefinitions(): Promise<MixDefinition[]>;

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
    packageTier: PackageTier;
    quotaTotal: number;
    mixName: CreatorApplication["mixName"];
    quotas: MonthlyTracking["quotas"];
    delivered: MonthlyTracking["delivered"];
    deadline: string; // YYYY-MM-DD
  }): Promise<MonthlyTracking>;
}
