import { PACKAGE_DEFINITIONS } from "@/domain/constants/packages";
import { MIX_DEFINITIONS } from "@/domain/constants/mixes";
import {
  creators,
  monthlyTrackings,
  rushes,
  videos,
  references
} from "@/data/mock-db";
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
    return monthlyTrackings.filter((tracking) => tracking.creatorId === creatorId).sort(byMonthDesc);
  }

  async listVideosByStatus(status: VideoStatus): Promise<VideoAsset[]> {
    return videos.filter((video) => video.status === status);
  }

  async listVideosByTracking(monthlyTrackingId: string): Promise<VideoAsset[]> {
    return videos.filter((video) => video.monthlyTrackingId === monthlyTrackingId);
  }

  async listRushesByTracking(monthlyTrackingId: string): Promise<RushAsset[]> {
    return rushes.filter((item) => item.monthlyTrackingId === monthlyTrackingId);
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
  }): Promise<VideoAsset> {
    throw new Error("Uploads are not available in offline mode");
  }

  async reviewVideoAsset(_input: {
    videoId: string;
    status: Extract<VideoStatus, "approved" | "rejected">;
    rejectionReason?: string | null;
    reviewedBy: string;
  }): Promise<VideoAsset> {
    throw new Error("Video review is not available in offline mode");
  }

  async updateTrackingDelivered(_input: {
    monthlyTrackingId: string;
    delivered: MonthlyTracking["delivered"];
  }): Promise<MonthlyTracking> {
    throw new Error("Tracking updates are not available in offline mode");
  }

  async listRates(): Promise<VideoRate[]> {
    return references.rates;
  }

  async listPackageDefinitions(): Promise<PackageDefinition[]> {
    return Object.values(PACKAGE_DEFINITIONS).sort((a, b) => a.tier - b.tier);
  }

  async listMixDefinitions(): Promise<MixDefinition[]> {
    return Object.values(MIX_DEFINITIONS);
  }

  async listCreatorApplications(_status?: ApplicationStatus): Promise<CreatorApplication[]> {
    // The in-memory repository is only used for offline/demo rendering.
    // Applications are stored in Supabase in real environments.
    return [];
  }

  async getCreatorApplicationByUserId(_userId: string): Promise<CreatorApplication | null> {
    return null;
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
    packageTier: PackageTier;
    quotaTotal: number;
    mixName: CreatorApplication["mixName"];
    quotas: MonthlyTracking["quotas"];
    delivered: MonthlyTracking["delivered"];
    deadline: string;
  }): Promise<MonthlyTracking> {
    throw new Error("Tracking provisioning is not available in offline mode");
  }
}
