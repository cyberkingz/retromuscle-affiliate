import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MonthlyTracking, VideoAsset } from "@/domain/types";
import type { CreatorRepository } from "@/application/repositories/creator-repository";

vi.mock("@/application/dependencies", () => ({
  getRepository: vi.fn()
}));

import { getRepository } from "@/application/dependencies";
import { reviewVideoUpload } from "@/application/use-cases/review-video-upload";

const VIDEO_ID = "video-001";
const CREATOR_ID = "creator-001";
const TRACKING_ID = "tracking-001";
const ADMIN_ID = "admin-001";

function makeVideo(overrides: Partial<VideoAsset> = {}): VideoAsset {
  return {
    id: VIDEO_ID,
    creatorId: CREATOR_ID,
    monthlyTrackingId: TRACKING_ID,
    videoType: "OOTD",
    fileUrl: "https://example.com/video.mp4",
    durationSeconds: 30,
    resolution: "1080x1920",
    fileSizeMb: 50,
    status: "pending_review",
    rejectionReason: undefined,
    reviewedAt: undefined,
    reviewedBy: undefined,
    createdAt: "2026-04-01T00:00:00Z",
    ...overrides
  };
}

function makeTracking(overrides: Partial<MonthlyTracking> = {}): MonthlyTracking {
  return {
    id: TRACKING_ID,
    creatorId: CREATOR_ID,
    month: "2026-04",
    delivered: { OOTD: 1, TRAINING: 0, BEFORE_AFTER: 0, SPORTS_80S: 0, CINEMATIC: 0 },
    paymentStatus: "en_cours",
    ...overrides
  };
}

function makeMockRepository(overrides: Partial<CreatorRepository> = {}): CreatorRepository {
  return {
    getVideoById: vi.fn().mockResolvedValue(null),
    reviewVideoAsset: vi.fn().mockResolvedValue(makeVideo()),
    reviewVideoAndUpdateTracking: vi.fn().mockResolvedValue({
      video: makeVideo({ status: "approved" }),
      tracking: makeTracking()
    }),
    updateTrackingDelivered: vi.fn().mockResolvedValue(makeTracking()),
    listVideosByTracking: vi.fn().mockResolvedValue([]),
    // Stubs for unused interface methods
    listCreators: vi.fn(),
    getCreatorById: vi.fn(),
    listMonthlyTrackings: vi.fn(),
    getMonthlyTracking: vi.fn(),
    getMonthlyTrackingById: vi.fn(),
    listCreatorTrackings: vi.fn(),
    listVideosByStatus: vi.fn(),
    listRushesByTracking: vi.fn(),
    createRushAsset: vi.fn(),
    createVideoAsset: vi.fn(),
    markMonthlyTrackingPaid: vi.fn(),
    listRates: vi.fn(),
    updateVideoRate: vi.fn(),
    deleteVideoRate: vi.fn(),
    getPayoutProfileByCreatorId: vi.fn(),
    listPayoutProfiles: vi.fn(),
    upsertPayoutProfile: vi.fn(),
    listContractSignaturesByCreatorId: vi.fn(),
    listCreatorApplications: vi.fn(),
    getCreatorApplicationByUserId: vi.fn(),
    upsertCreatorApplication: vi.fn(),
    reviewCreatorApplication: vi.fn(),
    getCreatorByUserId: vi.fn(),
    updateCreatorStatus: vi.fn(),
    upsertCreatorFromApplication: vi.fn(),
    createMonthlyTracking: vi.fn(),
    ...overrides
  } as unknown as CreatorRepository;
}

describe("reviewVideoUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when trying to reject an already approved video", async () => {
    const approvedVideo = makeVideo({ status: "approved" });
    const repo = makeMockRepository({
      getVideoById: vi.fn().mockResolvedValue(approvedVideo)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await expect(
      reviewVideoUpload({ adminUserId: ADMIN_ID, videoId: VIDEO_ID, decision: "rejected" })
    ).rejects.toThrow("Cannot change status of an already approved video");
  });

  it("does NOT check getVideoById when approving (only rejection needs the guard)", async () => {
    const repo = makeMockRepository({
      reviewVideoAndUpdateTracking: vi.fn().mockResolvedValue({
        video: makeVideo({ status: "approved" }),
        tracking: makeTracking()
      })
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await reviewVideoUpload({ adminUserId: ADMIN_ID, videoId: VIDEO_ID, decision: "approved" });

    expect(repo.getVideoById).not.toHaveBeenCalled();
  });

  it("approves a pending video via atomic RPC", async () => {
    const approvedVideo = makeVideo({ status: "approved", reviewedBy: ADMIN_ID });
    const tracking = makeTracking();
    const repo = makeMockRepository({
      reviewVideoAndUpdateTracking: vi.fn().mockResolvedValue({
        video: approvedVideo,
        tracking
      })
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    const result = await reviewVideoUpload({
      adminUserId: ADMIN_ID,
      videoId: VIDEO_ID,
      decision: "approved"
    });

    expect(repo.reviewVideoAndUpdateTracking).toHaveBeenCalledWith({
      videoId: VIDEO_ID,
      status: "approved",
      rejectionReason: null,
      reviewedBy: ADMIN_ID
    });
    expect(result).toEqual({ video: approvedVideo, tracking });
  });

  it("rejects a pending video and passes reason via atomic RPC", async () => {
    const pendingVideo = makeVideo({ status: "pending_review" });
    const rejectedVideo = makeVideo({ status: "rejected", rejectionReason: "Too dark" });
    const repo = makeMockRepository({
      getVideoById: vi.fn().mockResolvedValue(pendingVideo),
      reviewVideoAndUpdateTracking: vi.fn().mockResolvedValue({
        video: rejectedVideo,
        tracking: makeTracking()
      })
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await reviewVideoUpload({
      adminUserId: ADMIN_ID,
      videoId: VIDEO_ID,
      decision: "rejected",
      rejectionReason: "Too dark"
    });

    expect(repo.reviewVideoAndUpdateTracking).toHaveBeenCalledWith({
      videoId: VIDEO_ID,
      status: "rejected",
      rejectionReason: "Too dark",
      reviewedBy: ADMIN_ID
    });
  });

  it("passes null rejectionReason when approving (not rejected)", async () => {
    const repo = makeMockRepository();
    vi.mocked(getRepository).mockReturnValue(repo);

    await reviewVideoUpload({ adminUserId: ADMIN_ID, videoId: VIDEO_ID, decision: "approved" });

    expect(repo.reviewVideoAndUpdateTracking).toHaveBeenCalledWith(
      expect.objectContaining({ rejectionReason: null })
    );
  });

  it("falls back to non-atomic path when RPC is missing", async () => {
    const pendingVideo = makeVideo({ status: "pending_review" });
    const approvedVideo = makeVideo({ status: "approved", reviewedBy: ADMIN_ID });
    const videoList = [
      approvedVideo,
      makeVideo({ id: "v2", status: "approved", videoType: "TRAINING" })
    ];
    const updatedTracking = makeTracking({
      delivered: { OOTD: 1, TRAINING: 1, BEFORE_AFTER: 0, SPORTS_80S: 0, CINEMATIC: 0 }
    });

    const repo = makeMockRepository({
      reviewVideoAndUpdateTracking: vi
        .fn()
        .mockRejectedValue(new Error("review_video_and_update_tracking: could not find function")),
      reviewVideoAsset: vi.fn().mockResolvedValue(approvedVideo),
      listVideosByTracking: vi.fn().mockResolvedValue(videoList),
      updateTrackingDelivered: vi.fn().mockResolvedValue(updatedTracking)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    const result = await reviewVideoUpload({
      adminUserId: ADMIN_ID,
      videoId: VIDEO_ID,
      decision: "approved"
    });

    expect(repo.reviewVideoAsset).toHaveBeenCalledWith({
      videoId: VIDEO_ID,
      status: "approved",
      rejectionReason: null,
      reviewedBy: ADMIN_ID
    });

    // Recalculates delivered counts from approved videos
    expect(repo.updateTrackingDelivered).toHaveBeenCalledWith({
      monthlyTrackingId: TRACKING_ID,
      delivered: expect.objectContaining({ OOTD: 1, TRAINING: 1 })
    });

    expect(result).toEqual({ video: approvedVideo, tracking: updatedTracking });
  });

  it("re-throws non-RPC errors from reviewVideoAndUpdateTracking", async () => {
    const repo = makeMockRepository({
      reviewVideoAndUpdateTracking: vi.fn().mockRejectedValue(new Error("Network timeout"))
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await expect(
      reviewVideoUpload({ adminUserId: ADMIN_ID, videoId: VIDEO_ID, decision: "approved" })
    ).rejects.toThrow("Network timeout");
  });

  it("does not check the video status guard when approving (allows pending_review → approved)", async () => {
    // Even if getVideoById would return a non-approved video, it's never called for approval
    const pendingVideo = makeVideo({ status: "pending_review" });
    const repo = makeMockRepository({
      getVideoById: vi.fn().mockResolvedValue(pendingVideo),
      reviewVideoAndUpdateTracking: vi.fn().mockResolvedValue({
        video: makeVideo({ status: "approved" }),
        tracking: makeTracking()
      })
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    const result = await reviewVideoUpload({
      adminUserId: ADMIN_ID,
      videoId: VIDEO_ID,
      decision: "approved"
    });

    expect(repo.getVideoById).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
