export interface OnboardingOptions {
  steps: Array<{ title: string; fields: string[] }>;
}

export interface ApplicationRecord {
  status: "draft" | "pending_review" | "approved" | "rejected";
  handle: string;
  full_name: string;
  email: string;
  whatsapp: string;
  country: string;
  address: string;
  social_tiktok?: string | null;
  social_instagram?: string | null;
  followers_tiktok: number;
  followers_instagram: number;
  submitted_at?: string | null;
  review_notes?: string | null;
}

export interface ApplicationFormState {
  fullName: string;
  whatsapp: string;
  country: string;
  address: string;
  socialTiktok: string;
  socialInstagram: string;
  followersTiktok: string;
  followersInstagram: string;
}

export type ApplicationFieldUpdater = <K extends keyof ApplicationFormState>(
  field: K,
  value: ApplicationFormState[K]
) => void;
