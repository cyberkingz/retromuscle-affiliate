import { getRepository } from "@/application/dependencies";

export async function recordRushUpload(input: {
  userId: string;
  monthlyTrackingId: string;
  fileName: string;
  fileUrl: string;
  fileSizeMb: number;
}) {
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

