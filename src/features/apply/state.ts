import type { ApplicationFormState, ApplicationRecord } from "@/features/apply/types";

export const WIZARD_STEPS: Array<{ title: string; description: string }> = [
  {
    title: "Infos perso",
    description: "Identite, contact et adresse"
  },
  {
    title: "Profil createur",
    description: "Reseaux, audience, portfolio"
  },
  {
    title: "Package et mix",
    description: "Volume et positionnement contenu"
  }
];

export const INITIAL_FORM: ApplicationFormState = {
  handle: "",
  fullName: "",
  email: "",
  whatsapp: "",
  country: "",
  address: "",
  socialTiktok: "",
  socialInstagram: "",
  followers: "",
  portfolioUrl: "",
  packageTier: 20,
  mixName: "VOLUME"
};

export function mapRecordToForm(record: ApplicationRecord): ApplicationFormState {
  return {
    handle: record.handle ?? "",
    fullName: record.full_name ?? "",
    email: record.email ?? "",
    whatsapp: record.whatsapp ?? "",
    country: record.country ?? "",
    address: record.address ?? "",
    socialTiktok: record.social_tiktok ?? "",
    socialInstagram: record.social_instagram ?? "",
    followers: String(record.followers ?? 0),
    portfolioUrl: record.portfolio_url ?? "",
    packageTier: record.package_tier ?? 20,
    mixName: record.mix_name ?? "VOLUME"
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
