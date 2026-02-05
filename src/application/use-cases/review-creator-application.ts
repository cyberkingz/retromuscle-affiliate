import { getRepository } from "@/application/dependencies";
import { calculateQuotas } from "@/domain/services/calculate-quotas";
import { VIDEO_TYPES, type CreatorApplication, type VideoTypeCount } from "@/domain/types";

function resolveTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveMonthNow(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function resolveMonthDeadline(month: string): string {
  const [yearRaw, monthRaw] = month.split("-");
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw);
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 1 || monthIndex > 12) {
    throw new Error("Invalid month value");
  }

  // Last day of month (monthIndex is 1-based; JS Date month is 0-based).
  const lastDay = new Date(year, monthIndex, 0);
  const day = String(lastDay.getDate()).padStart(2, "0");
  const normalizedMonth = String(monthIndex).padStart(2, "0");
  return `${year}-${normalizedMonth}-${day}`;
}

function resolveZeroDelivered(): VideoTypeCount {
  return VIDEO_TYPES.reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {} as VideoTypeCount);
}

export interface ReviewCreatorApplicationInput {
  userId: string;
  decision: "approved" | "rejected";
  reviewNotes?: string | null;
}

export interface ReviewCreatorApplicationResult {
  application: CreatorApplication;
  creatorId?: string;
  monthlyTrackingId?: string;
}

export async function reviewCreatorApplication(
  input: ReviewCreatorApplicationInput
): Promise<ReviewCreatorApplicationResult> {
  const repository = getRepository();
  const application = await repository.getCreatorApplicationByUserId(input.userId);

  if (!application) {
    throw new Error("Application not found");
  }

  if (input.decision === "rejected") {
    const reviewed = await repository.reviewCreatorApplication({
      userId: input.userId,
      status: "rejected",
      reviewNotes: input.reviewNotes ?? null
    });

    return { application: reviewed };
  }

  if (application.status === "draft") {
    throw new Error("Cannot approve a draft application");
  }

  const startDate = resolveTodayIsoDate();
  const creator = await repository.upsertCreatorFromApplication({
    application,
    status: "actif",
    startDate
  });

  const month = resolveMonthNow();
  const existingTracking = await repository.getMonthlyTracking(creator.id, month);

  let monthlyTrackingId: string | undefined;

  if (existingTracking) {
    monthlyTrackingId = existingTracking.id;
  } else {
    const [packages, mixes] = await Promise.all([
      repository.listPackageDefinitions(),
      repository.listMixDefinitions()
    ]);

    const pkg = packages.find((item) => item.tier === application.packageTier);
    if (!pkg) {
      throw new Error("Package definition not found");
    }

    const mix = mixes.find((item) => item.name === application.mixName);
    if (!mix) {
      throw new Error("Mix definition not found");
    }

    const quotaTotal = pkg.quotaVideos;
    const quotas = calculateQuotas(quotaTotal, mix);
    const tracking = await repository.createMonthlyTracking({
      creatorId: creator.id,
      month,
      packageTier: application.packageTier,
      quotaTotal,
      mixName: application.mixName,
      quotas,
      delivered: resolveZeroDelivered(),
      deadline: resolveMonthDeadline(month)
    });

    monthlyTrackingId = tracking.id;
  }

  const reviewed = await repository.reviewCreatorApplication({
    userId: input.userId,
    status: "approved",
    reviewNotes: input.reviewNotes ?? null
  });

  return {
    application: reviewed,
    creatorId: creator.id,
    monthlyTrackingId
  };
}
