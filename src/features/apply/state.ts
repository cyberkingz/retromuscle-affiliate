import type { ApplicationFormState, ApplicationRecord } from "@/features/apply/types";

export const WIZARD_STEPS: Array<{ title: string; description: string }> = [
  {
    title: "Infos perso",
    description: "Identite, contact et adresse"
  },
  {
    title: "Profil createur",
    description: "Reseaux et audience"
  }
];

export const INITIAL_FORM: ApplicationFormState = {
  fullName: "",
  whatsapp: "",
  country: "",
  address: "",
  socialTiktok: "",
  socialInstagram: "",
  followersTiktok: "",
  followersInstagram: ""
};

export function mapRecordToForm(record: ApplicationRecord): ApplicationFormState {
  return {
    fullName: record.full_name ?? "",
    whatsapp: record.whatsapp ?? "",
    country: record.country ?? "",
    address: record.address ?? "",
    socialTiktok: record.social_tiktok ?? "",
    socialInstagram: record.social_instagram ?? "",
    followersTiktok: String(record.followers_tiktok ?? 0),
    followersInstagram: String(record.followers_instagram ?? 0)
  };
}

export function statusLabel(status: ApplicationRecord["status"]): string {
  if (status === "draft") {
    return "Brouillon";
  }
  if (status === "pending_review") {
    return "En revue";
  }
  if (status === "approved") {
    return "Accepte";
  }
  return "Refuse";
}

export function statusTone(status: ApplicationRecord["status"]): "neutral" | "success" | "warning" {
  if (status === "approved") {
    return "success";
  }
  if (status === "pending_review") {
    return "warning";
  }
  return "neutral";
}
