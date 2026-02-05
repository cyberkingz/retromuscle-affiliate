import { MIX_DEFINITIONS } from "@/domain/constants/mixes";
import { PACKAGE_DEFINITIONS } from "@/domain/constants/packages";
import { VIDEO_RATES } from "@/domain/constants/video-rates";
import { calculateQuotas } from "@/domain/services/calculate-quotas";
import type {
  Creator,
  MixName,
  MonthlyTracking,
  RushAsset,
  VideoAsset,
  VideoTypeCount
} from "@/domain/types";

function count(override: Partial<VideoTypeCount> = {}): VideoTypeCount {
  return {
    OOTD: 0,
    TRAINING: 0,
    BEFORE_AFTER: 0,
    SPORTS_80S: 0,
    CINEMATIC: 0,
    ...override
  };
}

function buildTracking(input: {
  id: string;
  month: string;
  creatorId: string;
  packageTier: 10 | 20 | 30 | 40;
  mixName: MixName;
  delivered: VideoTypeCount;
  deadline: string;
  paymentStatus: "a_faire" | "en_cours" | "paye";
  paidAt?: string;
}): MonthlyTracking {
  const packageDef = PACKAGE_DEFINITIONS[input.packageTier];
  const mix = MIX_DEFINITIONS[input.mixName];

  return {
    id: input.id,
    month: input.month,
    creatorId: input.creatorId,
    packageTier: input.packageTier,
    quotaTotal: packageDef.quotaVideos,
    mixName: input.mixName,
    quotas: calculateQuotas(packageDef.quotaVideos, mix),
    delivered: input.delivered,
    deadline: input.deadline,
    paymentStatus: input.paymentStatus,
    paidAt: input.paidAt
  };
}

export const creators: Creator[] = [
  {
    id: "creator_emma",
    handle: "@emma_fit",
    displayName: "Emma Rivier",
    email: "emma@retromuscle-creators.com",
    whatsapp: "+33 6 12 00 00 01",
    country: "FR",
    address: "25 Rue Saint-Maur, Paris",
    followers: 14300,
    socialLinks: {
      tiktok: "https://www.tiktok.com/@emma_fit",
      instagram: "https://www.instagram.com/emma_fit"
    },
    packageTier: 20,
    defaultMix: "VOLUME",
    status: "actif",
    startDate: "2025-11-08",
    contractSignedAt: "2025-11-10T09:40:00.000Z"
  },
  {
    id: "creator_marc",
    handle: "@marc_gym",
    displayName: "Marc Dupont",
    email: "marc@retromuscle-creators.com",
    whatsapp: "+33 6 12 00 00 02",
    country: "FR",
    address: "12 Avenue Jean Jaures, Lyon",
    followers: 29100,
    socialLinks: {
      tiktok: "https://www.tiktok.com/@marc_gym",
      instagram: "https://www.instagram.com/marc_gym"
    },
    packageTier: 30,
    defaultMix: "EQUILIBRE",
    status: "actif",
    startDate: "2025-10-14",
    contractSignedAt: "2025-10-16T12:00:00.000Z"
  },
  {
    id: "creator_julie",
    handle: "@julie_fit",
    displayName: "Julie Martin",
    email: "julie@retromuscle-creators.com",
    whatsapp: "+32 499 00 00 03",
    country: "BE",
    address: "5 Rue des Tongres, Bruxelles",
    followers: 8900,
    socialLinks: {
      tiktok: "https://www.tiktok.com/@julie_fit",
      instagram: "https://www.instagram.com/julie_fit"
    },
    packageTier: 10,
    defaultMix: "TRANSFO_HEAVY",
    status: "candidat",
    startDate: "2026-01-03",
    contractSignedAt: "2026-01-07T10:20:00.000Z"
  }
];

export const monthlyTrackings: MonthlyTracking[] = [
  buildTracking({
    id: "track_emma_2026_02",
    month: "2026-02",
    creatorId: "creator_emma",
    packageTier: 20,
    mixName: "VOLUME",
    delivered: count({ OOTD: 8, TRAINING: 7, BEFORE_AFTER: 4, SPORTS_80S: 0, CINEMATIC: 0 }),
    deadline: "2026-02-28",
    paymentStatus: "en_cours"
  }),
  buildTracking({
    id: "track_marc_2026_02",
    month: "2026-02",
    creatorId: "creator_marc",
    packageTier: 30,
    mixName: "EQUILIBRE",
    delivered: count({ OOTD: 9, TRAINING: 9, BEFORE_AFTER: 8, SPORTS_80S: 3, CINEMATIC: 1 }),
    deadline: "2026-02-28",
    paymentStatus: "a_faire"
  }),
  buildTracking({
    id: "track_julie_2026_02",
    month: "2026-02",
    creatorId: "creator_julie",
    packageTier: 10,
    mixName: "TRANSFO_HEAVY",
    delivered: count({ OOTD: 2, TRAINING: 3, BEFORE_AFTER: 4, SPORTS_80S: 1, CINEMATIC: 0 }),
    deadline: "2026-02-28",
    paymentStatus: "paye",
    paidAt: "2026-02-01T07:30:00.000Z"
  }),
  buildTracking({
    id: "track_emma_2026_01",
    month: "2026-01",
    creatorId: "creator_emma",
    packageTier: 20,
    mixName: "VOLUME",
    delivered: count({ OOTD: 8, TRAINING: 7, BEFORE_AFTER: 4, SPORTS_80S: 0, CINEMATIC: 1 }),
    deadline: "2026-01-31",
    paymentStatus: "paye",
    paidAt: "2026-02-05T09:00:00.000Z"
  })
];

export const videos: VideoAsset[] = [
  {
    id: "video_pending_1",
    monthlyTrackingId: "track_emma_2026_02",
    creatorId: "creator_emma",
    videoType: "CINEMATIC",
    fileUrl: "https://cdn.retromuscle.local/emma/cinematic-1.mp4",
    durationSeconds: 45,
    resolution: "1080x1920",
    fileSizeMb: 224,
    status: "pending_review",
    createdAt: "2026-02-04T07:10:00.000Z"
  },
  {
    id: "video_pending_2",
    monthlyTrackingId: "track_julie_2026_02",
    creatorId: "creator_julie",
    videoType: "TRAINING",
    fileUrl: "https://cdn.retromuscle.local/julie/training-2.mp4",
    durationSeconds: 32,
    resolution: "1080x1920",
    fileSizeMb: 155,
    status: "pending_review",
    createdAt: "2026-02-04T06:50:00.000Z"
  },
  {
    id: "video_pending_3",
    monthlyTrackingId: "track_julie_2026_02",
    creatorId: "creator_julie",
    videoType: "BEFORE_AFTER",
    fileUrl: "https://cdn.retromuscle.local/julie/ba-4.mp4",
    durationSeconds: 38,
    resolution: "1080x1080",
    fileSizeMb: 162,
    status: "pending_review",
    createdAt: "2026-02-04T06:15:00.000Z"
  }
];

export const rushes: RushAsset[] = [
  {
    id: "rush_1",
    monthlyTrackingId: "track_emma_2026_02",
    creatorId: "creator_emma",
    fileName: "raw-gym-angle-a.mov",
    fileSizeMb: 410,
    createdAt: "2026-02-03T11:00:00.000Z"
  },
  {
    id: "rush_2",
    monthlyTrackingId: "track_emma_2026_02",
    creatorId: "creator_emma",
    fileName: "raw-transition-b.mov",
    fileSizeMb: 370,
    createdAt: "2026-02-03T11:15:00.000Z"
  }
];

export const references = {
  packages: PACKAGE_DEFINITIONS,
  mixes: MIX_DEFINITIONS,
  rates: VIDEO_RATES
};
