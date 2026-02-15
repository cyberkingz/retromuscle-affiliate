import { getRepository } from "@/application/dependencies";
import { BRAND_ASSETS } from "@/domain/constants/brand-assets";
import { MIX_LABELS, VIDEO_TYPE_LABELS } from "@/domain/constants/labels";
import { calculatePayout } from "@/domain/services/calculate-payout";
import { calculateQuotas } from "@/domain/services/calculate-quotas";
import { VIDEO_TYPES } from "@/domain/types";

export interface SaasLandingData {
  hero: {
    kicker: string;
    title: string;
    subtitle: string;
    primaryCta: { label: string; href: "/apply" };
    visuals: {
      logoUrl: string;
      primaryImageUrl: string;
      secondaryImageUrl: string;
      productImageUrls: string[];
    };
  };
  trustPoints: Array<{ label: string; value: string }>;
  painToValue: Array<{ pain: string; value: string }>;
  flow: Array<{ title: string; description: string }>;
  earnings: {
    title: string;
    subtitle: string;
    scenarios: Array<{
      tier: number;
      videos: number;
      credits: number;
      mixName: string;
      mixLabel: string;
      estimatedAmount: number;
      breakdown: Array<{ label: string; delivered: number; rate: number; subtotal: number }>;
      assumptions: string[];
    }>;
  };
  qualifier: {
    title: string;
    subtitle: string;
    forWho: string[];
    notForWho: string[];
  };
  socialProof: {
    testimonials: Array<{ name: string; role: string; quote: string }>;
    trustedBy: string[];
  };
  pricing: Array<{ tier: number; videos: number; credits: number }>;
  faqs: Array<{ question: string; answer: string }>;
  action: {
    title: string;
    subtitle: string;
    cta: { label: string; href: "/apply" };
  };
}

export async function getSaasLandingData(): Promise<SaasLandingData> {
  const repository = getRepository();
  const [packages, mixes, rates] = await Promise.all([
    repository.listPackageDefinitions(),
    repository.listMixDefinitions(),
    repository.listRates()
  ]);

  const baselineMix =
    mixes.find((mix) => mix.name === "EQUILIBRE") ??
    mixes.find((mix) => mix.name === "VOLUME") ??
    mixes[0];

  const earningsScenarios = baselineMix
    ? packages
        .slice()
        .sort((a, b) => a.tier - b.tier)
        .map((pkg) => {
          const quotas = calculateQuotas(pkg.quotaVideos, baselineMix);
          const payout = calculatePayout(quotas, rates, pkg.monthlyCredits);
          return {
            tier: pkg.tier,
            videos: pkg.quotaVideos,
            credits: pkg.monthlyCredits,
            mixName: baselineMix.name,
            mixLabel: MIX_LABELS[baselineMix.name],
            estimatedAmount: payout.total,
            breakdown: payout.items.map((item) => ({
              label: VIDEO_TYPE_LABELS[item.key as keyof typeof VIDEO_TYPE_LABELS],
              delivered: item.delivered,
              rate: item.rate,
              subtotal: item.subtotal
            })),
            assumptions: [
              `Si tu livres tes ${pkg.quotaVideos} videos du mois`,
              `Style: ${MIX_LABELS[baselineMix.name]} (${VIDEO_TYPES.map((t) => VIDEO_TYPE_LABELS[t]).join(", ")})`,
              "Seules les videos validees comptent",
              "Le bonus fixe mensuel est inclus dans l'estimation"
            ]
          };
        })
    : [];

  return {
    hero: {
      kicker: "Programme Createur RetroMuscle",
      title: "Transforme ton contenu en revenu mensuel.",
      subtitle:
        "On te donne un brief, tu filmes, on te paie. Tous les mois.",
      primaryCta: { label: "Je veux rejoindre le programme", href: "/apply" },
      visuals: {
        logoUrl: BRAND_ASSETS.logo,
        primaryImageUrl: BRAND_ASSETS.heroLifestyle,
        secondaryImageUrl: BRAND_ASSETS.heroVertical,
        productImageUrls: [...BRAND_ASSETS.productShots]
      }
    },
    trustPoints: [
      { label: "Reponse", value: "Sous 48h" },
      { label: "Missions", value: "Chaque mois" },
      { label: "Paiement", value: "Mensuel" },
      { label: "Brief", value: "Clair" }
    ],
    painToValue: [
      {
        pain: "Tu postes beaucoup mais ton audience rapporte peu",
        value: "Tu monetises ton contenu avec des missions remunerees chaque mois"
      },
      {
        pain: "Les collaborations one-shot donnent des revenus irreguliers",
        value: "Tu construis une base de revenu recurrente avec RetroMuscle"
      },
      {
        pain: "Trop de temps perdu entre negociation, revisions et relances",
        value: "Tu recois un cadre simple: brief, production, validation, paiement"
      }
    ],
    flow: [
      {
        title: "1. Tu candidates",
        description: "En 3 minutes: profil, reseaux, style. Revue humaine et reponse rapide."
      },
      {
        title: "2. Tu produis",
        description: "Brief du mois, consignes claires, upload simple. Tu sais exactement quoi filmer."
      },
      {
        title: "3. Tu es paye",
        description: "Tes videos sont validees, ton paiement est envoye. Pas de relances, pas de flou."
      }
    ],
    earnings: {
      title: "Combien tu peux gagner",
      subtitle: "Estimation si tu livres toutes tes videos du mois.",
      scenarios: earningsScenarios
    },
    qualifier: {
      title: "Pour qui (et pas pour qui)",
      subtitle: "On prefere des createurs reguliers a des gros comptes inactifs.",
      forWho: [
        "Tu peux filmer chaque mois, meme 10 videos, avec un planning simple",
        "Tu aimes filmer: training, OOTD, before/after, vibe retro gym",
        "Tu veux un cadre clair: brief, validation, paiement mensuel"
      ],
      notForWho: [
        "Tu ne peux pas tenir un rythme mensuel regulier",
        "Tu n'acceptes pas les retours quand une video ne correspond pas au brief",
        "Tu veux etre paye sans validation de qualite"
      ]
    },
    socialProof: {
      testimonials: [],
      trustedBy: []
    },
    pricing: packages.map((pkg) => ({
      tier: pkg.tier,
      videos: pkg.quotaVideos,
      credits: pkg.monthlyCredits
    })),
    faqs: [
      {
        question: "En combien de temps je peux commencer ?",
        answer: "En general, une reponse sous 48h apres la soumission de ton dossier."
      },
      {
        question: "Quand suis-je paye ?",
        answer:
          "Chaque mois: une fois tes videos validees, ton paiement est prepare (delais bancaires possibles)."
      },
      {
        question: "Et si une video est rejetee ?",
        answer: "Tu vois la raison, puis tu peux re-uploader une version conforme."
      },
      {
        question: "Est-ce que tout le monde est accepte ?",
        answer: "Non. On valide selon le fit, la qualite, et les besoins campagnes du moment."
      }
    ],
    action: {
      title: "Rejoins le programme createur RetroMuscle.",
      subtitle: "Inscription rapide, revue humaine, puis des missions payees tous les mois.",
      cta: {
        label: "S'inscrire maintenant",
        href: "/apply"
      }
    }
  };
}
