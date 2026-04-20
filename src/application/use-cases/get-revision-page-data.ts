import { getRepository } from "@/application/dependencies";
import { VIDEO_TYPE_LABELS } from "@/domain/constants/labels";
import type { VideoAsset, VideoType } from "@/domain/types";

export interface RevisionPageData {
  originalVideo: VideoAsset;
  adminNote: string | null;
  /** All videos for the same type in the same tracking period, oldest-first. */
  versionHistory: VideoAsset[];
  monthlyTrackingId: string;
  ratesByType: Array<{
    videoType: VideoType;
    label: string;
    ratePerVideo: number;
  }>;
  specs: string[];
}

export async function getRevisionPageData(input: {
  userId: string;
  videoId: string;
}): Promise<RevisionPageData> {
  const repository = getRepository();

  const creator = await repository.getCreatorByUserId(input.userId);
  if (!creator) {
    throw new Error("Creator not found");
  }

  if (creator.status !== "actif") {
    throw new Error("Creator account is not active");
  }

  const video = await repository.getVideoById(input.videoId);
  if (!video) {
    throw new Error("Video not found");
  }

  if (video.creatorId !== creator.id) {
    throw new Error("Access denied");
  }

  if (video.status !== "revision_requested") {
    throw new Error(`Video is not awaiting revision (status: ${video.status})`);
  }

  const [trackingVideos, rates] = await Promise.all([
    repository.listVideosByTracking(video.monthlyTrackingId),
    repository.listRates()
  ]);

  // Build the supersession chain for this specific video.
  // supersededBy on a video means "I was replaced by that video's id".
  // We walk backwards from `video` to find all its predecessors, giving
  // us only the lineage for this revision cycle rather than every video
  // of the same type in the tracking period.
  const chainIds = new Set<string>();
  let node: typeof video | undefined = video;
  while (node) {
    chainIds.add(node.id);
    const predecessor = trackingVideos.find(
      (v) => v.supersededBy === node!.id && !chainIds.has(v.id)
    );
    node = predecessor;
  }

  const versionHistory = trackingVideos
    .filter((v) => chainIds.has(v.id))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const ratesByType = rates
    .filter((rate) => !rate.isPlaceholder)
    .map((rate) => ({
      videoType: rate.videoType,
      label: VIDEO_TYPE_LABELS[rate.videoType],
      ratePerVideo: rate.ratePerVideo
    }));

  const specs = [
    "Formats preferes: MP4, MOV (autres formats videos acceptes)",
    "Resolution recommandee: 1080x1920 (9:16) ou 1080x1080 (1:1)",
    "Duree recommandee: 15 a 60 secondes",
    "Taille recommandee: <= 500MB"
  ];

  return {
    originalVideo: video,
    adminNote: video.rejectionReason ?? null,
    versionHistory,
    monthlyTrackingId: video.monthlyTrackingId,
    ratesByType,
    specs
  };
}
