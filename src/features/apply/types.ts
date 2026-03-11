export interface OnboardingOptions {
  packages: Array<{ tier: number; quotaVideos: number; monthlyCredits: number }>;
  mixes: Array<{ name: string; positioning: string }>;
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
  followers: number;
  portfolio_url?: string | null;
  package_tier: number;
  mix_name: string;
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
  followers: string;
  packageTier: number;
  mixName: string;
}

export type ApplicationFieldUpdater = <K extends keyof ApplicationFormState>(
  field: K,
  value: ApplicationFormState[K]
) => void;
