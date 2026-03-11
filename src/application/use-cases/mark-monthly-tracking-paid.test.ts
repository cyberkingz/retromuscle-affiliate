import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CreatorPayoutProfile, MonthlyTracking } from "@/domain/types";
import type { CreatorRepository } from "@/application/repositories/creator-repository";

// Mock the dependencies module so we can inject a fake repository
vi.mock("@/application/dependencies", () => ({
  getRepository: vi.fn()
}));

// Import after mocking so the mock is in place
import { getRepository } from "@/application/dependencies";
import { markMonthlyTrackingPaid } from "@/application/use-cases/mark-monthly-tracking-paid";

const TRACKING_ID = "tracking-001";
const CREATOR_ID = "creator-001";

function createTracking(overrides: Partial<MonthlyTracking> = {}): MonthlyTracking {
  return {
    id: TRACKING_ID,
    month: "2026-02",
    creatorId: CREATOR_ID,
    packageTier: 20,
    quotaTotal: 10,
    mixName: "EQUILIBRE",
    quotas: { OOTD: 4, TRAINING: 3, BEFORE_AFTER: 2, SPORTS_80S: 0, CINEMATIC: 1 },
    delivered: { OOTD: 4, TRAINING: 3, BEFORE_AFTER: 2, SPORTS_80S: 0, CINEMATIC: 1 },
    deadline: "2026-02-28",
    paymentStatus: "en_cours",
    ...overrides
  };
}

function createProfile(overrides: Partial<CreatorPayoutProfile> = {}): CreatorPayoutProfile {
  return {
    creatorId: CREATOR_ID,
    method: "iban",
    accountHolderName: "Test Creator",
    iban: "FR7630006000011234567890189",
    paypalEmail: null,
    stripeAccount: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides
  };
}

function makeMockRepository(overrides: Partial<CreatorRepository> = {}): CreatorRepository {
  return {
    getMonthlyTrackingById: vi.fn().mockResolvedValue(null),
    getPayoutProfileByCreatorId: vi.fn().mockResolvedValue(null),
    markMonthlyTrackingPaid: vi.fn().mockResolvedValue(null),
    // Stubs for the remaining interface methods (not exercised in this use case)
    listCreators: vi.fn(),
    getCreatorById: vi.fn(),
    listMonthlyTrackings: vi.fn(),
    getMonthlyTracking: vi.fn(),
    listCreatorTrackings: vi.fn(),
    listVideosByStatus: vi.fn(),
    listVideosByTracking: vi.fn(),
    listRushesByTracking: vi.fn(),
    createRushAsset: vi.fn(),
    createVideoAsset: vi.fn(),
    reviewVideoAsset: vi.fn(),
    reviewVideoAndUpdateTracking: vi.fn(),
    updateTrackingDelivered: vi.fn(),
    listRates: vi.fn(),
    listPackageDefinitions: vi.fn(),
    listMixDefinitions: vi.fn(),
    updatePackageDefinition: vi.fn(),
    updateMixDefinition: vi.fn(),
    updateVideoRate: vi.fn(),
    listPayoutProfiles: vi.fn(),
    upsertPayoutProfile: vi.fn(),
    listContractSignaturesByCreatorId: vi.fn(),
    listCreatorApplications: vi.fn(),
    getCreatorApplicationByUserId: vi.fn(),
    reviewCreatorApplication: vi.fn(),
    getCreatorByUserId: vi.fn(),
    upsertCreatorFromApplication: vi.fn(),
    createMonthlyTracking: vi.fn(),
    ...overrides
  } as unknown as CreatorRepository;
}

describe("markMonthlyTrackingPaid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when tracking is not found", async () => {
    const repo = makeMockRepository({
      getMonthlyTrackingById: vi.fn().mockResolvedValue(null)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await expect(
      markMonthlyTrackingPaid({ monthlyTrackingId: "nonexistent" })
    ).rejects.toThrow("Impossible: suivi mensuel introuvable.");
  });

  it("throws when payout profile is missing", async () => {
    const tracking = createTracking();
    const repo = makeMockRepository({
      getMonthlyTrackingById: vi.fn().mockResolvedValue(tracking),
      getPayoutProfileByCreatorId: vi.fn().mockResolvedValue(null)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await expect(
      markMonthlyTrackingPaid({ monthlyTrackingId: TRACKING_ID })
    ).rejects.toThrow("Impossible: ce createur n'a pas configure son profil de paiement.");
  });

  it("throws when IBAN profile has no IBAN value", async () => {
    const tracking = createTracking();
    const profile = createProfile({ method: "iban", iban: null });
    const repo = makeMockRepository({
      getMonthlyTrackingById: vi.fn().mockResolvedValue(tracking),
      getPayoutProfileByCreatorId: vi.fn().mockResolvedValue(profile)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await expect(
      markMonthlyTrackingPaid({ monthlyTrackingId: TRACKING_ID })
    ).rejects.toThrow("Impossible: le profil de paiement IBAN est incomplet (IBAN manquant).");
  });

  it("throws when PayPal profile has no email", async () => {
    const tracking = createTracking();
    const profile = createProfile({ method: "paypal", paypalEmail: null });
    const repo = makeMockRepository({
      getMonthlyTrackingById: vi.fn().mockResolvedValue(tracking),
      getPayoutProfileByCreatorId: vi.fn().mockResolvedValue(profile)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await expect(
      markMonthlyTrackingPaid({ monthlyTrackingId: TRACKING_ID })
    ).rejects.toThrow("Impossible: le profil de paiement PayPal est incomplet (email manquant).");
  });

  it("throws when Stripe profile has no account", async () => {
    const tracking = createTracking();
    const profile = createProfile({ method: "stripe", stripeAccount: null });
    const repo = makeMockRepository({
      getMonthlyTrackingById: vi.fn().mockResolvedValue(tracking),
      getPayoutProfileByCreatorId: vi.fn().mockResolvedValue(profile)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await expect(
      markMonthlyTrackingPaid({ monthlyTrackingId: TRACKING_ID })
    ).rejects.toThrow("Impossible: le profil de paiement Stripe est incomplet (compte manquant).");
  });

  it("returns existing tracking unchanged when already paid (idempotency)", async () => {
    const tracking = createTracking({ paymentStatus: "paye" });
    const repo = makeMockRepository({
      getMonthlyTrackingById: vi.fn().mockResolvedValue(tracking)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    const result = await markMonthlyTrackingPaid({ monthlyTrackingId: TRACKING_ID });
    expect(result).toBe(tracking);
    // Should NOT call getPayoutProfileByCreatorId or markMonthlyTrackingPaid
    expect(repo.getPayoutProfileByCreatorId).not.toHaveBeenCalled();
    expect(repo.markMonthlyTrackingPaid).not.toHaveBeenCalled();
  });

  it("calls markMonthlyTrackingPaid on the repository with correct params", async () => {
    const tracking = createTracking({ paymentStatus: "en_cours" });
    const profile = createProfile({ method: "iban", iban: "FR7630006000011234567890189" });
    const updatedTracking = createTracking({ paymentStatus: "paye", paidAt: "2026-02-23T12:00:00Z" });

    const repo = makeMockRepository({
      getMonthlyTrackingById: vi.fn().mockResolvedValue(tracking),
      getPayoutProfileByCreatorId: vi.fn().mockResolvedValue(profile),
      markMonthlyTrackingPaid: vi.fn().mockResolvedValue(updatedTracking)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    const result = await markMonthlyTrackingPaid({
      monthlyTrackingId: TRACKING_ID,
      paidAt: "2026-02-23T12:00:00Z"
    });

    expect(repo.markMonthlyTrackingPaid).toHaveBeenCalledWith({
      monthlyTrackingId: TRACKING_ID,
      paidAt: "2026-02-23T12:00:00Z"
    });
    expect(result).toBe(updatedTracking);
  });

  it("defaults paidAt to null when not provided", async () => {
    const tracking = createTracking({ paymentStatus: "en_cours" });
    const profile = createProfile();
    const updatedTracking = createTracking({ paymentStatus: "paye" });

    const repo = makeMockRepository({
      getMonthlyTrackingById: vi.fn().mockResolvedValue(tracking),
      getPayoutProfileByCreatorId: vi.fn().mockResolvedValue(profile),
      markMonthlyTrackingPaid: vi.fn().mockResolvedValue(updatedTracking)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    await markMonthlyTrackingPaid({ monthlyTrackingId: TRACKING_ID });

    expect(repo.markMonthlyTrackingPaid).toHaveBeenCalledWith({
      monthlyTrackingId: TRACKING_ID,
      paidAt: null
    });
  });

  it("succeeds with a valid PayPal profile", async () => {
    const tracking = createTracking({ paymentStatus: "en_cours" });
    const profile = createProfile({
      method: "paypal",
      paypalEmail: "creator@example.com",
      iban: null
    });
    const updatedTracking = createTracking({ paymentStatus: "paye" });

    const repo = makeMockRepository({
      getMonthlyTrackingById: vi.fn().mockResolvedValue(tracking),
      getPayoutProfileByCreatorId: vi.fn().mockResolvedValue(profile),
      markMonthlyTrackingPaid: vi.fn().mockResolvedValue(updatedTracking)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    const result = await markMonthlyTrackingPaid({ monthlyTrackingId: TRACKING_ID });
    expect(result).toBe(updatedTracking);
  });

  it("succeeds with a valid Stripe profile", async () => {
    const tracking = createTracking({ paymentStatus: "en_cours" });
    const profile = createProfile({
      method: "stripe",
      stripeAccount: "acct_abc123",
      iban: null
    });
    const updatedTracking = createTracking({ paymentStatus: "paye" });

    const repo = makeMockRepository({
      getMonthlyTrackingById: vi.fn().mockResolvedValue(tracking),
      getPayoutProfileByCreatorId: vi.fn().mockResolvedValue(profile),
      markMonthlyTrackingPaid: vi.fn().mockResolvedValue(updatedTracking)
    });
    vi.mocked(getRepository).mockReturnValue(repo);

    const result = await markMonthlyTrackingPaid({ monthlyTrackingId: TRACKING_ID });
    expect(result).toBe(updatedTracking);
  });
});
