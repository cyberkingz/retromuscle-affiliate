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
  handle: string;
  fullName: string;
  email: string;
  whatsapp: string;
  country: string;
  address: string;
  socialTiktok: string;
  socialInstagram: string;
  followers: string;
  portfolioUrl: string;
  packageTier: number;
  mixName: string;
}

export type ApplicationFieldUpdater = <K extends keyof ApplicationFormState>(
  field: K,
  value: ApplicationFormState[K]
) => void;

export interface ApplyMarketingData {
  heroImageUrl?: string;
  attention: {
    badge: string;
    headline: string;
    supportingText: string;
  };
  interestPoints: string[];
  socialProof: {
    stats: Array<{ label: string; value: string }>;
    creators: Array<{ name: string; niche: string; quote: string }>;
    trustedBy: string[];
  };
  desire: {
    title: string;
    bullets: string[];
  };
  action: {
    urgencyText: string;
    reassurance: string;
  };
}
