import { getRepository } from "@/application/dependencies";
import type { ApplicationStatus, CreatorApplication } from "@/domain/types";

export interface AdminApplicationsData {
  applications: CreatorApplication[];
  counts: Record<ApplicationStatus, number>;
}

export async function getAdminApplicationsData(input?: {
  status?: ApplicationStatus;
}): Promise<AdminApplicationsData> {
  const repository = getRepository();
  const applications = await repository.listCreatorApplications(input?.status);

  const counts = applications.reduce<Record<ApplicationStatus, number>>(
    (acc, application) => {
      acc[application.status] = (acc[application.status] ?? 0) + 1;
      return acc;
    },
    { draft: 0, pending_review: 0, approved: 0, rejected: 0 }
  );

  return {
    applications,
    counts
  };
}

