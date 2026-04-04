import { VIDEO_RATES } from "@/domain/constants/video-rates";
import type {
  Creator,
  MonthlyTracking,
  RushAsset,
  VideoAsset
} from "@/domain/types";

// Empty data -- demo records removed for production launch.
// InMemoryCreatorRepository uses these as fallback when Supabase is not configured.
export const creators: Creator[] = [];

export const monthlyTrackings: MonthlyTracking[] = [];

export const videos: VideoAsset[] = [];

export const rushes: RushAsset[] = [];

export const references = {
  rates: VIDEO_RATES
};
