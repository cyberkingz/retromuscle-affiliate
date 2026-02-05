import type { MixDefinition, MixName } from "@/domain/types";

export const MIX_DEFINITIONS: Record<MixName, MixDefinition> = {
  VOLUME: {
    name: "VOLUME",
    distribution: {
      OOTD: 0.4,
      TRAINING: 0.35,
      BEFORE_AFTER: 0.2,
      SPORTS_80S: 0,
      CINEMATIC: 0.05
    },
    positioning: "Max volume performance. Direction artistique minimale."
  },
  EQUILIBRE: {
    name: "EQUILIBRE",
    distribution: {
      OOTD: 0.3,
      TRAINING: 0.3,
      BEFORE_AFTER: 0.25,
      SPORTS_80S: 0.1,
      CINEMATIC: 0.05
    },
    positioning: "Mix équilibré performance + image de marque."
  },
  PREMIUM_80S: {
    name: "PREMIUM_80S",
    distribution: {
      OOTD: 0.2,
      TRAINING: 0.25,
      BEFORE_AFTER: 0.2,
      SPORTS_80S: 0.2,
      CINEMATIC: 0.15
    },
    positioning: "Direction artistique forte, coût créatif plus élevé."
  },
  TRANSFO_HEAVY: {
    name: "TRANSFO_HEAVY",
    distribution: {
      OOTD: 0.2,
      TRAINING: 0.25,
      BEFORE_AFTER: 0.4,
      SPORTS_80S: 0.1,
      CINEMATIC: 0.05
    },
    positioning: "Focus transformations Before/After."
  }
};
