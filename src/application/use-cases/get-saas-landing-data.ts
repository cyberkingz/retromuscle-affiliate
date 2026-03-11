import { getRepository } from "@/application/dependencies";
import { BRAND_ASSETS } from "@/domain/constants/brand-assets";
import { MIX_LABELS, VIDEO_TYPE_LABELS } from "@/domain/constants/labels";
import { calculatePayout } from "@/domain/services/calculate-payout";
import { calculateQuotas } from "@/domain/services/calculate-quotas";
import { VIDEO_TYPES } from "@/domain/types";

/* ------------------------------------------------------------------ */
/*  Image/Text block — reusable alternating layout data                */
/* ------------------------------------------------------------------ */
export interface ImageTextBlock {
  tag: string;
  title: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
  imagePosition: "left" | "right";
  bullets?: string[];
  cta?: { label: string; href: "/apply" };
}

/* ------------------------------------------------------------------ */
/*  Flow step                                                          */
/* ------------------------------------------------------------------ */
export interface FlowStep {
  step: number;
  title: string;
  description: string;
}

export interface FlowData {
  title: string;
  subtitle: string;
  steps: FlowStep[];
}

/* ------------------------------------------------------------------ */
/*  Earnings scenario (dynamic from DB)                                */
/* ------------------------------------------------------------------ */
export interface EarningsScenario {
  tier: number;
  videos: number;
  credits: number;
  mixLabel: string;
  estimatedAmount: number;
  breakdown: Array<{ label: string; delivered: number; rate: number; subtotal: number }>;
}

/* ------------------------------------------------------------------ */
/*  Qualifier                                                          */
/* ------------------------------------------------------------------ */
export interface QualifierData {
  sectionTitle: string;
  imageUrl: string;
  imageAlt: string;
  forWhoLabel: string;
  forWho: string[];
  notForWhoLabel: string;
  notForWho: string[];
}

/* ------------------------------------------------------------------ */
/*  FAQ item                                                           */
/* ------------------------------------------------------------------ */
export interface FaqItem {
  question: string;
  answer: string;
}

/* ------------------------------------------------------------------ */
/*  Root landing data                                                  */
/* ------------------------------------------------------------------ */
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
  flow: FlowData;
  imageTextBlocks: ImageTextBlock[];
  earnings: {
    title: string;
    subtitle: string;
    scenarios: EarningsScenario[];
    packages: Array<{ tier: number; videos: number; credits: number }>;
    cta: { label: string; href: "/apply" };
    hint: string;
  };
  qualifier: QualifierData;
  faqs: FaqItem[];
  action: {
    title: string;
    subtitle: string;
    cta: { label: string; href: "/apply" };
  };
}

/* ------------------------------------------------------------------ */
/*  Data fetcher                                                       */
/* ------------------------------------------------------------------ */
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

  const sortedPackages = packages.slice().sort((a, b) => a.tier - b.tier);

  const earningsScenarios: EarningsScenario[] = baselineMix
    ? sortedPackages.map((pkg) => {
        const quotas = calculateQuotas(pkg.quotaVideos, baselineMix);
        const payout = calculatePayout(quotas, rates, pkg.monthlyCredits);
        return {
          tier: pkg.tier,
          videos: pkg.quotaVideos,
          credits: pkg.monthlyCredits,
          mixLabel: MIX_LABELS[baselineMix.name],
          estimatedAmount: payout.total,
          breakdown: payout.items.map((item) => ({
            label: VIDEO_TYPE_LABELS[item.key as keyof typeof VIDEO_TYPE_LABELS],
            delivered: item.delivered,
            rate: item.rate,
            subtotal: item.subtotal
          }))
        };
      })
    : [];

  return {
    /* ---- ATTENTION ------------------------------------------------- */
    hero: {
      kicker: "Programme Créateurs RetroMuscle",
      title: "Transforme tes vidéos fitness en revenus récurrents.",
      subtitle:
        "Pas une collab one-shot. Pas un partenariat flou. Un programme structuré\u00a0: tu filmes, on valide, tu encaisses.",
      primaryCta: { label: "Rejoindre le programme", href: "/apply" },
      visuals: {
        logoUrl: BRAND_ASSETS.logo,
        primaryImageUrl: BRAND_ASSETS.heroLifestyle,
        secondaryImageUrl: BRAND_ASSETS.heroVertical,
        productImageUrls: [...BRAND_ASSETS.productShots]
      }
    },

    /* ---- INTEREST -------------------------------------------------- */
    flow: {
      title: "Simple. Direct. Rémunéré.",
      subtitle: "Trois étapes entre toi et ton premier virement RetroMuscle.",
      steps: [
        {
          step: 1,
          title: "Tu candidates",
          description: "Remplis le formulaire en 3 minutes. On regarde ton profil, ton énergie — pas ton nombre d'abonnés."
        },
        {
          step: 2,
          title: "Tu produis",
          description: "Chaque mois, tu reçois ton brief RetroMuscle. Tu filmes. Tu envoies. On valide sous 72h."
        },
        {
          step: 3,
          title: "Tu encaisses",
          description: "Chaque vidéo validée est payée. Virement mensuel sur IBAN, PayPal ou Stripe. Sans attendre 90 jours."
        }
      ]
    },

    /* ---- INTEREST + DESIRE ----------------------------------------- */
    imageTextBlocks: [
      {
        tag: "La fin des collabs fantômes",
        title: "Des marques qui paient à la livraison, ça existe. On en fait partie.",
        body: "Tu connais le schéma\u00a0: une DM enthousiaste, un brief vague, et puis le silence. Ou le paiement qui tarde. RetroMuscle fonctionne autrement. Critères de validation clairs, paiement à date fixe. On a construit ça pour les créateurs sérieux.",
        imageUrl: BRAND_ASSETS.heroLifestyle,
        imageAlt: "Créateurs RetroMuscle en séance photo dans une salle de sport rétro",
        imagePosition: "left",
        bullets: [
          "Critères de validation transparents avant que tu commences à filmer",
          "Paiement déclenché à la validation — pas 45 jours après",
          "Un interlocuteur dédié, pas une adresse email générique"
        ]
      },
      {
        tag: "Qualité premium",
        title: "Du coton 340g qui se voit à l'écran. Des pièces que tu as envie de porter.",
        body: "On ne t'envoie pas un t-shirt logo à filmer une fois. Les pièces RetroMuscle sont conçues pour la salle, pour la rue, pour l'image. L'esthétique Golden Era — les couleurs, les coupes, les broderies — crée du contenu qui sort du flux.",
        imageUrl: BRAND_ASSETS.lifestyleProduct,
        imageAlt: "Gros plan sur un sweat RetroMuscle avec broderie cousue et coton épais",
        imagePosition: "right",
        cta: { label: "Découvrir le programme", href: "/apply" }
      }
    ],

    /* ---- DESIRE ---------------------------------------------------- */
    earnings: {
      title: "Combien tu peux gagner chaque mois",
      subtitle: "Ta rémunération dépend du nombre de vidéos validées et de ton pack. Les créateurs les plus actifs touchent plusieurs centaines d'euros par mois.",
      scenarios: earningsScenarios,
      packages: sortedPackages.map((pkg) => ({
        tier: pkg.tier,
        videos: pkg.quotaVideos,
        credits: pkg.monthlyCredits
      })),
      cta: { label: "Je postule au programme", href: "/apply" },
      hint: "Le critère, c'est la qualité de ton contenu — pas la taille de ta communauté."
    },

    qualifier: {
      sectionTitle: "Ce programme n'est pas pour tout le monde.",
      imageUrl: BRAND_ASSETS.lifestyleGym,
      imageAlt: "Créateur RetroMuscle filmant du contenu dans une salle de sport",
      forWhoLabel: "C'est fait pour toi si",
      forWho: [
        "Tu crées du contenu fitness régulièrement — même sans gros compte",
        "Tu cherches un revenu récurrent, pas juste un échange produit",
        "Tu aimes l'esthétique rétro et tu veux représenter une marque avec une vraie identité"
      ],
      notForWhoLabel: "Ce n'est pas fait pour toi si",
      notForWho: [
        "Tu veux juste recevoir des vêtements gratuits sans produire régulièrement",
        "Tu n'es pas prêt à respecter un brief mensuel et des délais",
        "Tu cherches un partenariat passif — ici, on paye ceux qui bossent"
      ]
    },

    /* ---- OVERCOME OBJECTIONS --------------------------------------- */
    faqs: [
      {
        question: "Combien d'abonnés faut-il pour candidater\u00a0?",
        answer: "Aucun minimum. On évalue la cohérence de ton contenu, ta régularité et ton énergie — pas ton compteur d'abonnés. Certains de nos meilleurs créateurs ont moins de 5\u00a0000 followers."
      },
      {
        question: "Comment se passe la validation des vidéos\u00a0?",
        answer: "Tu soumets ta vidéo via ton espace créateur. On la vérifie sous 72h selon les critères du brief. Si elle est validée, elle est comptabilisée pour ta rémunération du mois. En cas de refus, tu reçois un retour clair pour corriger et resoumettre."
      },
      {
        question: "Quand est-ce que je suis payé\u00a0?",
        answer: "Les paiements sont traités une fois par mois, sur la base des vidéos validées. Tu choisis ton mode de paiement à l'inscription\u00a0: IBAN, PayPal ou Stripe. Pas de délai de 60 ou 90 jours."
      },
      {
        question: "Est-ce que je peux être refusé\u00a0?",
        answer: "Oui. On sélectionne les créateurs dont le profil correspond à l'univers RetroMuscle. Si ta candidature n'est pas retenue, tu peux candidater à nouveau au cycle suivant."
      },
      {
        question: "Combien de vidéos par mois\u00a0?",
        answer: "Ça dépend du pack que tu choisis à l'inscription (10, 20, 30 ou 40 vidéos/mois). Tu sélectionnes l'engagement qui correspond à ta capacité. Le quota est fixé au départ et n'évolue pas sans ton accord."
      }
    ],

    /* ---- ACTION ---------------------------------------------------- */
    action: {
      title: "Le contenu que tu fais déjà mérite d'être payé.",
      subtitle: "Postule en 5 minutes. On revient vers toi sous 72h. Aucun engagement avant contrat signé.",
      cta: {
        label: "Rejoindre le programme maintenant",
        href: "/apply"
      }
    }
  };
}
