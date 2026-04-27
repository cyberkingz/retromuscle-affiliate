export type ReviewDecision = "approved" | "rejected" | "revision_requested";

export interface ParsedReviewDecision {
  decision: ReviewDecision;
  rejectionReason: string | null;
}

/**
 * Parses and validates the decision + rejectionReason fields shared by all
 * admin video/batch review endpoints. Throws on validation failure.
 */
export function parseReviewDecision(input: Record<string, unknown>): ParsedReviewDecision {
  const decision = input.decision;
  const rejectionReason =
    typeof input.rejectionReason === "string" ? input.rejectionReason.trim() : null;

  if (decision !== "approved" && decision !== "rejected" && decision !== "revision_requested") {
    throw new Error("Invalid decision");
  }
  if ((decision === "revision_requested" || decision === "rejected") && !rejectionReason) {
    throw new Error("rejectionReason is required when rejecting or requesting a revision");
  }
  if (rejectionReason && rejectionReason.length > 2000) {
    throw new Error("rejectionReason is too long");
  }

  return { decision, rejectionReason };
}
