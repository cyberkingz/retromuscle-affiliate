export const VIDEO_TYPES = ["OOTD", "TRAINING", "BEFORE_AFTER", "SPORTS_80S", "CINEMATIC"] as const;

export type VideoType = (typeof VIDEO_TYPES)[number];

export type CreatorStatus = "candidat" | "actif" | "pause" | "inactif";
export type PaymentStatus = "a_faire" | "en_cours" | "paye";
export type VideoStatus = "uploaded" | "pending_review" | "approved" | "rejected" | "revision_requested";
export type ApplicationStatus = "draft" | "pending_review" | "approved" | "rejected";
export type PayoutMethod = "iban" | "paypal";

export type VideoTypeCount = Record<VideoType, number>;

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
  followersTiktok: number;
  followersInstagram: number;
  socialLinks: SocialLinks;
  status: CreatorStatus;
  startDate: string;
  contractSignedAt?: string;
  notes?: string;
  // Shopify per-creator kit promo code + order tracking
  kitPromoCode?: string;
  shopifyDiscountId?: string;
  kitOrderPlacedAt?: string;
  shopifyKitOrderId?: string;
  kitOrderAmount?: number | null;
  kitOrderCurrency?: string | null;
}

/**
 * Derived kit status for a creator, used by admin UI and dashboard logic.
 * - `pending_code`: contract signed but code generation not yet complete (or failed without flag)
 * - `code_ready`: code generated, creator has not placed the kit order yet
 * - `ordered`: webhook received, kit order placed (kitOrderPlacedAt is set)
 * - `failed`: code generation attempted and failed — admin retry surface
 * - `not_applicable`: creator has not signed contract yet
 */
export type CreatorKitStatus =
  | "not_applicable"
  | "pending_code"
  | "code_ready"
  | "ordered"
  | "failed";

export interface MonthlyTracking {
  id: string;
  month: string;
  creatorId: string;
  delivered: VideoTypeCount;
  paymentStatus: PaymentStatus;
  paidAt?: string;
  paidAmount?: number | null;
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
  supersededBy?: string;
  batchSubmissionId?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
}

export type UploadMode = "single" | "batch";

export interface BatchSubmission {
  id: string;
  monthlyTrackingId: string;
  creatorId: string;
  videoType: VideoType;
  status: VideoStatus;
  minClipsRequired: number;
  clipCount: number;
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
}

export interface RushAsset {
  id: string;
  monthlyTrackingId: string;
  creatorId: string;
  fileName: string;
  fileSizeMb: number;
  fileUrl?: string;
  createdAt: string;
}

export interface CreatorPayoutProfile {
  creatorId: string;
  method: PayoutMethod;
  accountHolderName?: string | null;
  iban?: string | null;
  paypalEmail?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorContractSignature {
  id: string;
  creatorId: string;
  userId: string;
  contractVersion: string;
  contractChecksum: string;
  signerName: string;
  acceptance: Record<string, boolean>;
  ip?: string | null;
  userAgent?: string | null;
  signedAt: string;
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
  followersTiktok: number;
  followersInstagram: number;
  submittedAt?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}
