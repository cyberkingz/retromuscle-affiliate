import { getRepository } from "@/application/dependencies";
import type { Creator, CreatorApplication } from "@/domain/types";
import { createZeroDeliveredCount, resolveCurrentMonth } from "@/application/use-cases/shared";

export type ReviewCreatorApplicationErrorCode =
  | "APPLICATION_NOT_FOUND"
  | "APPLICATION_ALREADY_REVIEWED"
  | "INVALID_APPLICATION_STATE"
  | "HANDLE_CONFLICT"
  | "EMAIL_CONFLICT";

export class ReviewCreatorApplicationError extends Error {
  constructor(
    public readonly code: ReviewCreatorApplicationErrorCode,
    message: string
  ) {
    super(message);
    this.name = "ReviewCreatorApplicationError";
  }
}

function resolveTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hasConstraintError(error: unknown, constraintName: string): boolean {
  return error instanceof Error && error.message.includes(constraintName);
}

function createFallbackHandle(input: { handle: string; userId: string }): string {
  const normalizedBase = input.handle.trim().replace(/\s+/g, "").slice(0, 24) || "@creator";
  const suffix = input.userId.replace(/-/g, "").slice(0, 6);
  const separator = normalizedBase.includes("-") ? "_" : "-";
  return `${normalizedBase}${separator}${suffix}`;
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
    throw new ReviewCreatorApplicationError("APPLICATION_NOT_FOUND", "Application introuvable.");
  }

  // Guard against mutating terminal-state applications
  if (application.status === "approved" || application.status === "rejected") {
    throw new ReviewCreatorApplicationError(
      "APPLICATION_ALREADY_REVIEWED",
      `Cette candidature est deja ${application.status === "approved" ? "approuvee" : "refusee"}.`
    );
  }

  if (input.decision === "rejected") {
    if (application.status === "draft") {
      throw new ReviewCreatorApplicationError(
        "INVALID_APPLICATION_STATE",
        "Impossible de refuser une candidature en brouillon."
      );
    }
    const reviewed = await repository.reviewCreatorApplication({
      userId: input.userId,
      status: "rejected",
      reviewNotes: input.reviewNotes ?? null
    });

    return { application: reviewed };
  }

  if (application.status === "draft") {
    throw new ReviewCreatorApplicationError(
      "INVALID_APPLICATION_STATE",
      "Impossible d'approuver une candidature en brouillon."
    );
  }

  // --- Atomic approval flow ---
  // 1. Provision creator + tracking first (idempotent via upsert).
  // 2. Mark the application as approved only AFTER provisioning succeeds.
  // This prevents the user from being stuck as "approved" without a creator record
  // (which would loop them to /onboarding with no escape).
  // If provisioning fails, the application stays in its current status and the admin can retry.

  const startDate = resolveTodayIsoDate();
  let creator: Creator;
  try {
    creator = await repository.upsertCreatorFromApplication({
      application,
      status: "actif",
      startDate
    });
  } catch (error) {
    if (hasConstraintError(error, "creators_handle_key")) {
      // Auto-resolve duplicate handles to avoid blocking approval flow.
      // The handle remains editable later by admin/creator if needed.
      const fallbackHandle = createFallbackHandle({
        handle: application.handle,
        userId: application.userId
      });

      try {
        creator = await repository.upsertCreatorFromApplication({
          application: {
            ...application,
            handle: fallbackHandle
          },
          status: "actif",
          startDate
        });
      } catch (retryError) {
        if (hasConstraintError(retryError, "creators_handle_key")) {
          throw new ReviewCreatorApplicationError(
            "HANDLE_CONFLICT",
            "Ce handle est deja utilise. Demande au createur de modifier son handle puis de re-soumettre."
          );
        }
        throw retryError;
      }
    } else if (hasConstraintError(error, "creators_email_key")) {
      throw new ReviewCreatorApplicationError(
        "EMAIL_CONFLICT",
        "Cet email est deja utilise sur un autre compte createur."
      );
    } else {
      throw error;
    }
  }

  const month = resolveCurrentMonth();
  const existingTracking = await repository.getMonthlyTracking(creator.id, month);

  let monthlyTrackingId: string | undefined;

  if (existingTracking) {
    monthlyTrackingId = existingTracking.id;
  } else {
    const tracking = await repository.createMonthlyTracking({
      creatorId: creator.id,
      month,
      delivered: createZeroDeliveredCount()
    });

    monthlyTrackingId = tracking.id;
  }

  // Only mark approved after all provisioning succeeded.
  // If this final step fails, the creator record already exists (idempotent upsert),
  // so the admin can safely retry the approval.
  let reviewed: CreatorApplication;
  try {
    reviewed = await repository.reviewCreatorApplication({
      userId: input.userId,
      status: "approved",
      reviewNotes: input.reviewNotes ?? null
    });
  } catch (approvalError) {
    // eslint-disable-next-line no-console
    console.error(
      "[reviewCreatorApplication] Creator provisioned but failed to mark application as approved. Admin can retry safely.",
      { userId: input.userId, creatorId: creator.id, approvalError }
    );
    throw approvalError;
  }

  return {
    application: reviewed,
    creatorId: creator.id,
    monthlyTrackingId
  };
}
