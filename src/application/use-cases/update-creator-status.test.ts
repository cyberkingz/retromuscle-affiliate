import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Creator } from "@/domain/types";
import type { CreatorRepository } from "@/application/repositories/creator-repository";

vi.mock("@/application/dependencies", () => ({
  getRepository: vi.fn()
}));

import { getRepository } from "@/application/dependencies";
import { updateCreatorStatus } from "@/application/use-cases/update-creator-status";

const CREATOR_ID = "creator-abc";

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
    startDate: "2026-01-01",
    ...overrides
  };
}

function makeMockRepository(overrides: Partial<CreatorRepository> = {}): CreatorRepository {
  return {
    getCreatorById: vi.fn().mockResolvedValue(null),
    updateCreatorStatus: vi.fn().mockResolvedValue(makeCreator()),
    // Stubs
    listCreators: vi.fn(),
    listMonthlyTrackings: vi.fn(),
    getMonthlyTracking: vi.fn(),
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
    getCreatorApplicationByUserId: vi.fn(),
    upsertCreatorApplication: vi.fn(),
    reviewCreatorApplication: vi.fn(),
    getCreatorByUserId: vi.fn(),
    upsertCreatorFromApplication: vi.fn(),
    createMonthlyTracking: vi.fn(),
    ...overrides
  } as unknown as CreatorRepository;
}

describe("updateCreatorStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when creator is not found", async () => {
    const repo = makeMockRepository({
      getCreatorById: vi.fn().mockResolvedValue(null)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await expect(updateCreatorStatus({ creatorId: CREATOR_ID, status: "pause" })).rejects.toThrow(
      "Creator not found"
    );
  });

  it("throws when trying to change status of a candidat creator", async () => {
    const repo = makeMockRepository({
      getCreatorById: vi.fn().mockResolvedValue(makeCreator({ status: "candidat" }))
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await expect(updateCreatorStatus({ creatorId: CREATOR_ID, status: "actif" })).rejects.toThrow(
      "Cannot change status of a candidat creator via this route"
    );
  });

  it("updates actif creator to pause", async () => {
    const paused = makeCreator({ status: "pause" });
    const repo = makeMockRepository({
      getCreatorById: vi.fn().mockResolvedValue(makeCreator({ status: "actif" })),
      updateCreatorStatus: vi.fn().mockResolvedValue(paused)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    const result = await updateCreatorStatus({ creatorId: CREATOR_ID, status: "pause" });

    expect(repo.updateCreatorStatus).toHaveBeenCalledWith({
      creatorId: CREATOR_ID,
      status: "pause"
    });
    expect(result.status).toBe("pause");
  });

  it("updates actif creator to inactif", async () => {
    const inactive = makeCreator({ status: "inactif" });
    const repo = makeMockRepository({
      getCreatorById: vi.fn().mockResolvedValue(makeCreator({ status: "actif" })),
      updateCreatorStatus: vi.fn().mockResolvedValue(inactive)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    const result = await updateCreatorStatus({ creatorId: CREATOR_ID, status: "inactif" });
    expect(result.status).toBe("inactif");
  });

  it("updates pause creator back to actif", async () => {
    const active = makeCreator({ status: "actif" });
    const repo = makeMockRepository({
      getCreatorById: vi.fn().mockResolvedValue(makeCreator({ status: "pause" })),
      updateCreatorStatus: vi.fn().mockResolvedValue(active)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    const result = await updateCreatorStatus({ creatorId: CREATOR_ID, status: "actif" });
    expect(result.status).toBe("actif");
  });

  it("calls repository with correct creatorId and status", async () => {
    const OTHER_ID = "other-creator-id";
    const repo = makeMockRepository({
      getCreatorById: vi.fn().mockResolvedValue(makeCreator({ id: OTHER_ID, status: "actif" })),
      updateCreatorStatus: vi
        .fn()
        .mockResolvedValue(makeCreator({ id: OTHER_ID, status: "inactif" }))
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await updateCreatorStatus({ creatorId: OTHER_ID, status: "inactif" });

    expect(repo.updateCreatorStatus).toHaveBeenCalledWith({
      creatorId: OTHER_ID,
      status: "inactif"
    });
  });
});
