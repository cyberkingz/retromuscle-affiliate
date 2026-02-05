import { getRepository } from "@/application/dependencies";
import { BRAND_ASSETS } from "@/domain/constants/brand-assets";

export interface SaasLandingData {
  hero: {
    kicker: string;
    title: string;
    subtitle: string;
    primaryCta: { label: string; href: "/apply" };
    secondaryCta: { label: string; href: "/creators" };
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
  const packages = await repository.listPackageDefinitions();

  return {
    hero: {
      kicker: "Programme Affilie RetroMuscle",
      title: "Transforme ton contenu en revenu stable.",
      subtitle:
        "Tu recois des missions chaque mois, un cadre clair pour tourner vite, et un paiement regulier quand les contenus sont valides.",
      primaryCta: { label: "Je veux rejoindre le programme", href: "/apply" },
      secondaryCta: { label: "Voir les revenus possibles", href: "/creators" },
      visuals: {
        logoUrl: BRAND_ASSETS.logo,
        primaryImageUrl: BRAND_ASSETS.heroLifestyle,
        secondaryImageUrl: BRAND_ASSETS.heroVertical,
        productImageUrls: [...BRAND_ASSETS.productShots]
      }
    },
    trustPoints: [
      { label: "Createurs actifs", value: "50+" },
      { label: "Missions / mois", value: "10-40" },
      { label: "Validation cible", value: "90%" },
      { label: "Paiement", value: "Mensuel" }
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
        description:
          "En 3 minutes: profil, reseaux et style de contenu. L'equipe valide ton fit rapidement."
      },
      {
        title: "2. Tu produis",
        description:
          "Tu recois tes missions du mois, tu tournes avec un brief clair et tu envoies tes contenus."
      },
      {
        title: "3. Tu es paye",
        description:
          "Une fois valide, ton paiement est prepare sans discussions interminables."
      }
    ],
    socialProof: {
      testimonials: [
        {
          name: "Emma",
          role: "Affiliee RetroMuscle - Paris",
          quote: "J'ai enfin une visibilite sur mes revenus: je sais quoi filmer et combien je touche."
        },
        {
          name: "Marc",
          role: "Affilie Training - Lyon",
          quote: "Avant c'etait aleatoire. Maintenant j'ai un rythme mensuel et des paiements plus previsibles."
        },
        {
          name: "Julie",
          role: "Affiliee Lifestyle - Bruxelles",
          quote: "Le process est simple: je cree, j'envoie, je suis payee. C'est pro et humain."
        }
      ],
      trustedBy: ["RetroMuscle", "Athletes Squad", "Community Team", "Creator Partners"]
    },
    pricing: packages.map((pkg) => ({
      tier: pkg.tier,
      videos: pkg.quotaVideos,
      credits: pkg.monthlyCredits
    })),
    faqs: [
      {
        question: "En combien de temps je peux commencer ?",
        answer: "En general sous 48h apres validation de ton profil."
      },
      {
        question: "Combien je peux gagner ?",
        answer: "Ca depend de ton pack, de ta regularite et de la qualite des livrables valides."
      },
      {
        question: "Quand je suis paye ?",
        answer: "Le paiement est effectue chaque mois apres validation des contenus."
      }
    ],
    action: {
      title: "Prends ta place dans le programme affilie RetroMuscle.",
      subtitle: "Candidature rapide, revue humaine, puis missions remunerees tous les mois.",
      cta: {
        label: "S'inscrire maintenant",
        href: "/apply"
      }
    }
  };
}
