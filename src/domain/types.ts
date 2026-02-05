export const VIDEO_TYPES = [
  "OOTD",
  "TRAINING",
  "BEFORE_AFTER",
  "SPORTS_80S",
  "CINEMATIC"
] as const;

export type VideoType = (typeof VIDEO_TYPES)[number];

export const MIX_NAMES = [
  "VOLUME",
  "EQUILIBRE",
  "PREMIUM_80S",
  "TRANSFO_HEAVY"
] as const;

export type MixName = (typeof MIX_NAMES)[number];

export type PackageTier = 10 | 20 | 30 | 40;

export type CreatorStatus = "candidat" | "actif" | "pause" | "inactif";
export type PaymentStatus = "a_faire" | "en_cours" | "paye";
export type VideoStatus = "uploaded" | "pending_review" | "approved" | "rejected";
export type ApplicationStatus = "draft" | "pending_review" | "approved" | "rejected";

export type VideoTypeCount = Record<VideoType, number>;

export interface PackageDefinition {
  tier: PackageTier;
  quotaVideos: number;
  monthlyCredits: number;
}

export interface MixDefinition {
  name: MixName;
  distribution: Record<VideoType, number>;
  positioning: string;
}

export interface VideoRate {
  videoType: VideoType;
  ratePerVideo: number;
  isPlaceholder: boolean;
}

export interface SocialLinks {
  tiktok?: string;
  instagram?: string;
}

export interface Creator {
  id: string;
  handle: string;
  displayName: string;
  email: string;
  whatsapp: string;
  country: string;
  address: string;
  followers: number;
  socialLinks: SocialLinks;
  packageTier: PackageTier;
  defaultMix: MixName;
  status: CreatorStatus;
  startDate: string;
  contractSignedAt?: string;
  notes?: string;
}

export interface MonthlyTracking {
  id: string;
  month: string;
  creatorId: string;
  packageTier: PackageTier;
  quotaTotal: number;
  mixName: MixName;
  quotas: VideoTypeCount;
  delivered: VideoTypeCount;
  deadline: string;
  paymentStatus: PaymentStatus;
  paidAt?: string;
}

export interface VideoAsset {
  id: string;
  monthlyTrackingId: string;
  creatorId: string;
  videoType: VideoType;
  fileUrl: string;
  durationSeconds: number;
  resolution: "1080x1920" | "1080x1080";
  fileSizeMb: number;
  status: VideoStatus;
  rejectionReason?: string;
  createdAt: string;
}

export interface RushAsset {
  id: string;
  monthlyTrackingId: string;
  creatorId: string;
  fileName: string;
  fileSizeMb: number;
  createdAt: string;
}

export interface CreatorApplication {
  id: string;
  userId: string;
  status: ApplicationStatus;
  handle: string;
  fullName: string;
  email: string;
  whatsapp: string;
  country: string;
  address: string;
  socialTiktok?: string;
  socialInstagram?: string;
  followers: number;
  portfolioUrl?: string;
  packageTier: PackageTier;
  mixName: MixName;
  submittedAt?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}
