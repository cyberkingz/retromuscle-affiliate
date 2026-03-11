import { getRepository } from "@/application/dependencies";

export async function reviewVideoUpload(input: {
  adminUserId: string;
  videoId: string;
  decision: "approved" | "rejected";
  rejectionReason?: string | null;
}) {
  const repository = getRepository();

  // Use atomic RPC that reviews the video and recalculates delivered counts
  // in a single database transaction — prevents race conditions.
  return repository.reviewVideoAndUpdateTracking({
    videoId: input.videoId,
    status: input.decision,
    rejectionReason: input.decision === "rejected" ? input.rejectionReason ?? null : null,
    reviewedBy: input.adminUserId
  });
}
