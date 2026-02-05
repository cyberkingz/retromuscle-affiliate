import { getRepository } from "@/application/dependencies";

export interface LandingPageData {
  hero: {
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: "/apply";
  };
  packages: Array<{
    tier: number;
    monthlyVideoQuota: number;
    monthlyCredits: number;
  }>;
  videoRates: Array<{
    videoType: string;
    ratePerVideo: number;
    isPlaceholder: boolean;
  }>;
  mixes: Array<{
    name: string;
    positioning: string;
    distributionPercentages: Record<string, number>;
  }>;
  goals: Array<{ label: string; metric: string }>;
  testimonials: Array<{ author: string; role: string; quote: string }>;
  faq: Array<{ question: string; answer: string }>;
}

export async function getLandingPageData(): Promise<LandingPageData> {
  const repository = getRepository();
  const [packages, rates, mixes] = await Promise.all([
    repository.listPackageDefinitions(),
    repository.listRates(),
    repository.listMixDefinitions()
  ]);

  return {
    hero: {
      title: "Programme affilie RetroMuscle",
      subtitle:
        "Transforme ton contenu en revenu mensuel avec des missions regulieres et un cadre clair.",
      ctaLabel: "S'inscrire maintenant",
      ctaHref: "/apply"
    },
    packages: packages.map((item) => ({
      tier: item.tier,
      monthlyVideoQuota: item.quotaVideos,
      monthlyCredits: item.monthlyCredits
    })),
    videoRates: rates.map((rate) => ({
      videoType: rate.videoType,
      ratePerVideo: rate.ratePerVideo,
      isPlaceholder: rate.isPlaceholder
    })),
    mixes: mixes.map((mix) => ({
      name: mix.name,
      positioning: mix.positioning,
      distributionPercentages: Object.fromEntries(
        Object.entries(mix.distribution).map(([key, value]) => [key, Math.round(value * 100)])
      )
    })),
    goals: [
      { label: "Affilies actifs", metric: "50+" },
      { label: "Missions / mois", metric: "10-40" },
      { label: "Paiement", metric: "Mensuel" },
      { label: "Reponse dossier", metric: "<48h" }
    ],
    testimonials: [
      {
        author: "Emma",
        role: "Affiliee RetroMuscle",
        quote: "Je sais enfin combien je peux gagner chaque mois avec un cadre clair."
      },
      {
        author: "Marc",
        role: "Affilie RetroMuscle",
        quote: "J'ai un rythme plus stable et je ne perds plus de temps en allers-retours."
      }
    ],
    faq: [
      {
        question: "Quand suis-je paye ?",
        answer: "Le paiement est declenche apres validation des videos du cycle mensuel."
      },
      {
        question: "Combien je peux gagner ?",
        answer: "Ca depend du pack choisi, de la regularite et de la qualite des contenus livres."
      },
      {
        question: "Quels formats video sont acceptes ?",
        answer: "MP4 ou MOV, vertical 9:16 ou carre 1:1, 15 a 60 secondes."
      }
    ]
  };
}
