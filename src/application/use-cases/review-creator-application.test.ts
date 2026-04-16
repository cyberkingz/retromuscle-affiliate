import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Creator, CreatorApplication, MonthlyTracking } from "@/domain/types";
import type { CreatorRepository } from "@/application/repositories/creator-repository";

vi.mock("@/application/dependencies", () => ({
  getRepository: vi.fn()
}));

import { getRepository } from "@/application/dependencies";
import {
  ReviewCreatorApplicationError,
  reviewCreatorApplication
} from "@/application/use-cases/review-creator-application";

const USER_ID = "user-abc";
const CREATOR_ID = "creator-xyz";
const TRACKING_ID = "tracking-001";

function makeApplication(overrides: Partial<CreatorApplication> = {}): CreatorApplication {
  return {
    id: "app-001",
    userId: USER_ID,
    handle: "@creator",
    fullName: "Test Creator",
    email: "creator@example.com",
    whatsapp: "+33612345678",
    country: "FR",
    address: "1 rue de Paris",
    socialTiktok: undefined,
    socialInstagram: undefined,
    followersTiktok: 5000,
    followersInstagram: 3000,
    status: "pending_review",
    reviewNotes: undefined,
    reviewedAt: undefined,
    submittedAt: "2026-04-01T10:00:00Z",
    createdAt: "2026-04-01T10:00:00Z",
    updatedAt: "2026-04-01T10:00:00Z",
    ...overrides
  };
}

function makeCreator(overrides: Partial<Creator> = {}): Creator {
  return {
    id: CREATOR_ID,
    handle: "@creator",
    displayName: "Test Creator",
    email: "creator@example.com",
    whatsapp: "+33612345678",
    country: "FR",
    address: "1 rue de Paris",
    socialLinks: {},
    followersTiktok: 5000,
    followersInstagram: 3000,
    status: "actif",
    notes: undefined,
    contractSignedAt: undefined,
    startDate: "2026-04-15",
    ...overrides
  };
}

function makeTracking(overrides: Partial<MonthlyTracking> = {}): MonthlyTracking {
  return {
    id: TRACKING_ID,
    creatorId: CREATOR_ID,
    month: "2026-04",
    delivered: { OOTD: 0, TRAINING: 0, BEFORE_AFTER: 0, SPORTS_80S: 0, CINEMATIC: 0 },
    paymentStatus: "en_cours",
    ...overrides
  };
}

function makeMockRepository(overrides: Partial<CreatorRepository> = {}): CreatorRepository {
  return {
    getCreatorApplicationByUserId: vi.fn().mockResolvedValue(null),
    reviewCreatorApplication: vi.fn().mockResolvedValue(makeApplication({ status: "approved" })),
    upsertCreatorFromApplication: vi.fn().mockResolvedValue(makeCreator()),
    getMonthlyTracking: vi.fn().mockResolvedValue(null),
    createMonthlyTracking: vi.fn().mockResolvedValue(makeTracking()),
    // Stubs
    listCreators: vi.fn(),
    getCreatorById: vi.fn(),
    listMonthlyTrackings: vi.fn(),
    getMonthlyTrackingById: vi.fn(),
    listCreatorTrackings: vi.fn(),
    getVideoById: vi.fn(),
    listVideosByStatus: vi.fn(),
    listVideosByTracking: vi.fn(),
    listRushesByTracking: vi.fn(),
    createRushAsset: vi.fn(),
    createVideoAsset: vi.fn(),
    reviewVideoAsset: vi.fn(),
    reviewVideoAndUpdateTracking: vi.fn(),
    updateTrackingDelivered: vi.fn(),
    markMonthlyTrackingPaid: vi.fn(),
    listRates: vi.fn().mockResolvedValue([]),
    updateVideoRate: vi.fn(),
    deleteVideoRate: vi.fn(),
    getPayoutProfileByCreatorId: vi.fn(),
    listPayoutProfiles: vi.fn(),
    upsertPayoutProfile: vi.fn(),
    listContractSignaturesByCreatorId: vi.fn(),
    listCreatorApplications: vi.fn(),
    upsertCreatorApplication: vi.fn(),
    getCreatorByUserId: vi.fn(),
    updateCreatorStatus: vi.fn(),
    ...overrides
  } as unknown as CreatorRepository;
}

describe("reviewCreatorApplication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws APPLICATION_NOT_FOUND when application does not exist", async () => {
    const repo = makeMockRepository({
      getCreatorApplicationByUserId: vi.fn().mockResolvedValue(null)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await expect(
      reviewCreatorApplication({ userId: USER_ID, decision: "approved" })
    ).rejects.toThrow(ReviewCreatorApplicationError);

    try {
      await reviewCreatorApplication({ userId: USER_ID, decision: "approved" });
    } catch (e) {
      expect(e).toBeInstanceOf(ReviewCreatorApplicationError);
      expect((e as ReviewCreatorApplicationError).code).toBe("APPLICATION_NOT_FOUND");
    }
  });

  it("throws APPLICATION_ALREADY_REVIEWED when already approved", async () => {
    const repo = makeMockRepository({
      getCreatorApplicationByUserId: vi
        .fn()
        .mockResolvedValue(makeApplication({ status: "approved" }))
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await expect(
      reviewCreatorApplication({ userId: USER_ID, decision: "rejected" })
    ).rejects.toMatchObject({ code: "APPLICATION_ALREADY_REVIEWED" });
  });

  it("throws APPLICATION_ALREADY_REVIEWED when already rejected", async () => {
    const repo = makeMockRepository({
      getCreatorApplicationByUserId: vi
        .fn()
        .mockResolvedValue(makeApplication({ status: "rejected" }))
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await expect(
      reviewCreatorApplication({ userId: USER_ID, decision: "approved" })
    ).rejects.toMatchObject({ code: "APPLICATION_ALREADY_REVIEWED" });
  });

  it("throws INVALID_APPLICATION_STATE when rejecting a draft", async () => {
    const repo = makeMockRepository({
      getCreatorApplicationByUserId: vi.fn().mockResolvedValue(makeApplication({ status: "draft" }))
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await expect(
      reviewCreatorApplication({ userId: USER_ID, decision: "rejected" })
    ).rejects.toMatchObject({ code: "INVALID_APPLICATION_STATE" });
  });

  it("throws INVALID_APPLICATION_STATE when approving a draft", async () => {
    const repo = makeMockRepository({
      getCreatorApplicationByUserId: vi.fn().mockResolvedValue(makeApplication({ status: "draft" }))
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await expect(
      reviewCreatorApplication({ userId: USER_ID, decision: "approved" })
    ).rejects.toMatchObject({ code: "INVALID_APPLICATION_STATE" });
  });

  it("rejects a pending_review application", async () => {
    const rejectedApp = makeApplication({ status: "rejected", reviewNotes: "Not qualified" });
    const repo = makeMockRepository({
      getCreatorApplicationByUserId: vi
        .fn()
        .mockResolvedValue(makeApplication({ status: "pending_review" })),
      reviewCreatorApplication: vi.fn().mockResolvedValue(rejectedApp)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    const result = await reviewCreatorApplication({
      userId: USER_ID,
      decision: "rejected",
      reviewNotes: "Not qualified"
    });

    expect(repo.reviewCreatorApplication).toHaveBeenCalledWith({
      userId: USER_ID,
      status: "rejected",
      reviewNotes: "Not qualified"
    });
    expect(result.application.status).toBe("rejected");
    // Should NOT create a creator record
    expect(repo.upsertCreatorFromApplication).not.toHaveBeenCalled();
  });

  it("approves a pending_review application: provisions creator + tracking then marks approved", async () => {
    const creator = makeCreator();
    const tracking = makeTracking();
    const approvedApp = makeApplication({ status: "approved" });

    const repo = makeMockRepository({
      getCreatorApplicationByUserId: vi
        .fn()
        .mockResolvedValue(makeApplication({ status: "pending_review" })),
      upsertCreatorFromApplication: vi.fn().mockResolvedValue(creator),
      getMonthlyTracking: vi.fn().mockResolvedValue(null),
      createMonthlyTracking: vi.fn().mockResolvedValue(tracking),
      reviewCreatorApplication: vi.fn().mockResolvedValue(approvedApp)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    const result = await reviewCreatorApplication({ userId: USER_ID, decision: "approved" });

    // Creator provisioned first
    expect(repo.upsertCreatorFromApplication).toHaveBeenCalledWith(
      expect.objectContaining({ status: "actif" })
    );

    // Tracking created because none existed
    expect(repo.createMonthlyTracking).toHaveBeenCalledWith(
      expect.objectContaining({ creatorId: CREATOR_ID })
    );

    // Application marked approved last
    expect(repo.reviewCreatorApplication).toHaveBeenCalledWith({
      userId: USER_ID,
      status: "approved",
      reviewNotes: null
    });

    expect(result.creatorId).toBe(CREATOR_ID);
    expect(result.monthlyTrackingId).toBe(TRACKING_ID);
  });

  it("reuses existing monthly tracking when already present", async () => {
    const existing = makeTracking({ id: "existing-tracking" });
    const repo = makeMockRepository({
      getCreatorApplicationByUserId: vi
        .fn()
        .mockResolvedValue(makeApplication({ status: "pending_review" })),
      getMonthlyTracking: vi.fn().mockResolvedValue(existing)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    const result = await reviewCreatorApplication({ userId: USER_ID, decision: "approved" });

    expect(repo.createMonthlyTracking).not.toHaveBeenCalled();
    expect(result.monthlyTrackingId).toBe("existing-tracking");
  });

  it("retries with fallback handle on creators_handle_key constraint error", async () => {
    const handleConflictError = new Error(
      "duplicate key value violates unique constraint creators_handle_key"
    );
    const creatorWithFallback = makeCreator({ handle: "@creator-abc123" });
    const approvedApp = makeApplication({ status: "approved" });

    const repo = makeMockRepository({
      getCreatorApplicationByUserId: vi
        .fn()
        .mockResolvedValue(makeApplication({ status: "pending_review" })),
      upsertCreatorFromApplication: vi
        .fn()
        .mockRejectedValueOnce(handleConflictError)
        .mockResolvedValueOnce(creatorWithFallback),
      reviewCreatorApplication: vi.fn().mockResolvedValue(approvedApp)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    const result = await reviewCreatorApplication({ userId: USER_ID, decision: "approved" });

    // upsertCreatorFromApplication called twice (first fails, retry succeeds)
    expect(repo.upsertCreatorFromApplication).toHaveBeenCalledTimes(2);
    expect(result.creatorId).toBe(CREATOR_ID);
  });

  it("throws HANDLE_CONFLICT when both attempts fail with handle constraint", async () => {
    const handleConflictError = new Error(
      "duplicate key value violates unique constraint creators_handle_key"
    );

    const repo = makeMockRepository({
      getCreatorApplicationByUserId: vi
        .fn()
        .mockResolvedValue(makeApplication({ status: "pending_review" })),
      upsertCreatorFromApplication: vi.fn().mockRejectedValue(handleConflictError)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await expect(
      reviewCreatorApplication({ userId: USER_ID, decision: "approved" })
    ).rejects.toMatchObject({ code: "HANDLE_CONFLICT" });
  });

  it("throws EMAIL_CONFLICT when email constraint is violated", async () => {
    const emailConflictError = new Error(
      "duplicate key value violates unique constraint creators_email_key"
    );

    const repo = makeMockRepository({
      getCreatorApplicationByUserId: vi
        .fn()
        .mockResolvedValue(makeApplication({ status: "pending_review" })),
      upsertCreatorFromApplication: vi.fn().mockRejectedValue(emailConflictError)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await expect(
      reviewCreatorApplication({ userId: USER_ID, decision: "approved" })
    ).rejects.toMatchObject({ code: "EMAIL_CONFLICT" });
  });

  it("re-throws unrecognized errors from upsertCreatorFromApplication", async () => {
    const repo = makeMockRepository({
      getCreatorApplicationByUserId: vi
        .fn()
        .mockResolvedValue(makeApplication({ status: "pending_review" })),
      upsertCreatorFromApplication: vi.fn().mockRejectedValue(new Error("Database connection lost"))
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await expect(
      reviewCreatorApplication({ userId: USER_ID, decision: "approved" })
    ).rejects.toThrow("Database connection lost");
  });

  it("passes reviewNotes through to the repository on approval", async () => {
    const repo = makeMockRepository({
      getCreatorApplicationByUserId: vi
        .fn()
        .mockResolvedValue(makeApplication({ status: "pending_review" }))
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await reviewCreatorApplication({
      userId: USER_ID,
      decision: "approved",
      reviewNotes: "Excellent profil"
    });

    expect(repo.reviewCreatorApplication).toHaveBeenCalledWith(
      expect.objectContaining({ reviewNotes: "Excellent profil" })
    );
  });
});
