import type {
  CreatorStatus,
  MixName,
  PaymentStatus,
  VideoStatus,
  VideoType
} from "@/domain/types";

export const VIDEO_TYPE_LABELS: Record<VideoType, string> = {
  OOTD: "OOTD",
  TRAINING: "Training",
  BEFORE_AFTER: "Before/After",
  SPORTS_80S: "Sports 80s",
  CINEMATIC: "Cinematic"
};

export const MIX_LABELS: Record<MixName, string> = {
  VOLUME: "Volume",
  EQUILIBRE: "Equilibre",
  PREMIUM_80S: "Premium 80s",
  TRANSFO_HEAVY: "Transfo Heavy"
};

export const CREATOR_STATUS_LABELS: Record<CreatorStatus, string> = {
  candidat: "Candidat",
  actif: "Actif",
  pause: "En pause",
  inactif: "Inactif"
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  a_faire: "A faire",
  en_cours: "En cours",
  paye: "Paye"
};

export const VIDEO_STATUS_LABELS: Record<VideoStatus, string> = {
  uploaded: "Upload",
  pending_review: "A valider",
  approved: "Approuve",
  rejected: "Rejete"
};
