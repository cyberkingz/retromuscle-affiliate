import { getRepository } from "@/application/dependencies";
import type { CreatorApplication, ApplicationStatus } from "@/domain/types";

export interface SaveCreatorApplicationInput {
  userId: string;
  authEmail: string;
  handle: string;
  fullName: string;
  whatsapp: string;
  country: string;
  address: string;
  socialTiktok?: string;
  socialInstagram?: string;
  followersTiktok: number;
  followersInstagram: number;
  submit: boolean;
}

const TERMINAL_STATUSES: ApplicationStatus[] = ["approved", "rejected"];

export async function saveCreatorApplication(
  input: SaveCreatorApplicationInput
): Promise<CreatorApplication> {
  const repository = getRepository();

  const existing = await repository.getCreatorApplicationByUserId(input.userId);
  if (existing && TERMINAL_STATUSES.includes(existing.status)) {
    const label = existing.status === "approved" ? "approuvee" : "refusee";
    throw Object.assign(new Error(`La candidature est deja ${label}.`), { statusCode: 409 });
  }

  return repository.upsertCreatorApplication({
    userId: input.userId,
    handle: input.handle,
    fullName: input.fullName,
    email: input.authEmail,
    whatsapp: input.whatsapp,
    country: input.country,
    address: input.address,
    socialTiktok: input.socialTiktok,
    socialInstagram: input.socialInstagram,
    followersTiktok: input.followersTiktok,
    followersInstagram: input.followersInstagram,
    submit: input.submit
  });
}
