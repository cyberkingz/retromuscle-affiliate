import { getRepository } from "@/application/dependencies";
import type { BatchSubmission, MonthlyTracking } from "@/domain/types";

export async function reviewBatchSubmission(input: {
  adminUserId: string;
  batchId: string;
  decision: "approved" | "rejected" | "revision_requested";
  rejectionReason?: string | null;
}): Promise<{ batch: BatchSubmission; tracking: MonthlyTracking }> {
  const repository = getRepository();

  const batch = await repository.getBatchSubmissionById(input.batchId);
  if (!batch) {
    throw new Error("Batch submission not found");
  }

  // Guard against downgrading an already-approved batch.
  // Approved batches have already incremented delivered counts (and may be paid).
  if (batch.status === "approved") {
    throw new Error("Cannot change status of an already approved batch submission");
  }

  if (
    (input.decision === "rejected" || input.decision === "revision_requested") &&
    !input.rejectionReason?.trim()
  ) {
    throw new Error("A rejection reason is required when rejecting or requesting revision");
  }

  const rejectionReason = input.decision !== "approved" ? (input.rejectionReason ?? null) : null;

  return repository.reviewBatchAndUpdateTracking({
    batchId: input.batchId,
    status: input.decision,
    rejectionReason,
    reviewedBy: input.adminUserId,
  });
}
