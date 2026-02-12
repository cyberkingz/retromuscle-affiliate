import { PACKAGE_DEFINITIONS } from "@/domain/constants/packages";
import { MIX_DEFINITIONS } from "@/domain/constants/mixes";
import { VIDEO_RATES } from "@/domain/constants/video-rates";
import type {
  Creator,
  MonthlyTracking,
  RushAsset,
  VideoAsset
} from "@/domain/types";

// Empty data — demo records removed for production launch.
// InMemoryCreatorRepository uses these as fallback when Supabase is not configured.
export const creators: Creator[] = [];

export const monthlyTrackings: MonthlyTracking[] = [];

export const videos: VideoAsset[] = [];

export const rushes: RushAsset[] = [];

export const references = {
  packages: PACKAGE_DEFINITIONS,
  mixes: MIX_DEFINITIONS,
  rates: VIDEO_RATES
};
