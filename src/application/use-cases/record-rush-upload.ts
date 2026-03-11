import { getRepository } from "@/application/dependencies";

export async function recordRushUpload(input: {
  userId: string;
  monthlyTrackingId: string;
  fileName: string;
  fileUrl: string;
  fileSizeMb: number;
}) {
  // Input validation (H-05)
  if (!input.fileName || typeof input.fileName !== "string" || input.fileName.length > 255) {
    throw new Error("fileName is required and must be at most 255 characters");
  }
  if (!input.fileUrl || typeof input.fileUrl !== "string") {
    throw new Error("fileUrl is required");
  }
  if (typeof input.fileSizeMb !== "number" || input.fileSizeMb <= 0 || input.fileSizeMb > 2048) {
    throw new Error("fileSizeMb must be between 1 and 2048");
  }

  const repository = getRepository();

  const creator = await repository.getCreatorByUserId(input.userId);
  if (!creator) {
    throw new Error("Creator not found");
  }

  const tracking = await repository.getMonthlyTrackingById(input.monthlyTrackingId);
  if (!tracking) {
    throw new Error("Monthly tracking not found");
  }

  if (tracking.creatorId !== creator.id) {
    throw new Error("Forbidden");
  }

  return repository.createRushAsset({
    monthlyTrackingId: tracking.id,
    creatorId: creator.id,
    fileName: input.fileName,
    fileUrl: input.fileUrl,
    fileSizeMb: input.fileSizeMb
  });
}

