import { getRepository } from "@/application/dependencies";
import type { VideoStatus, VideoType } from "@/domain/types";

export interface AdminContentVideo {
  videoId: string;
  creatorId: string;
  creatorHandle: string;
  videoType: VideoType;
  fileUrl: string;
  cfStreamUid?: string;
  status: VideoStatus;
  rejectionReason?: string;
  durationSeconds: number;
  resolution: string;
  reviewedAt?: string;
  uploadedAt: string;
}

export interface AdminContentData {
  videos: AdminContentVideo[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    revision: number;
  };
}

export async function getAdminContentData(): Promise<AdminContentData> {
  const repository = getRepository();
  const [videos, creators] = await Promise.all([
    repository.listAllVideos(),
    repository.listCreators()
  ]);

  const creatorById = new Map(creators.map((c) => [c.id, c]));

  const enriched: AdminContentVideo[] = videos
    .filter((video) => !video.supersededBy) // hide old versions already replaced by a revision
    .map((video) => ({
    videoId: video.id,
    creatorId: video.creatorId,
    creatorHandle: creatorById.get(video.creatorId)?.handle ?? "@inconnu",
    videoType: video.videoType,
    fileUrl: video.fileUrl,
    cfStreamUid: video.cfStreamUid,
    status: video.status,
    rejectionReason: video.rejectionReason,
    durationSeconds: video.durationSeconds,
    resolution: video.resolution,
    reviewedAt: video.reviewedAt,
    uploadedAt: video.createdAt
  }));

  const stats = {
    total: enriched.length,
    pending: enriched.filter((v) => v.status === "pending_review").length,
    approved: enriched.filter((v) => v.status === "approved").length,
    rejected: enriched.filter((v) => v.status === "rejected").length,
    revision: enriched.filter((v) => v.status === "revision_requested").length
  };

  return { videos: enriched, stats };
}
