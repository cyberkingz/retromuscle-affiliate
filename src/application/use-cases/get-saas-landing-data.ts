import { getRepository } from "@/application/dependencies";
import { BRAND_ASSETS } from "@/domain/constants/brand-assets";
import { VIDEO_TYPE_LABELS } from "@/domain/constants/labels";
import { calculatePayout } from "@/domain/services/calculate-payout";
import { VIDEO_TYPES } from "@/domain/types";

/* ------------------------------------------------------------------ */
/*  Image/Text block -- reusable alternating layout data               */
/* ------------------------------------------------------------------ */
export interface ImageTextBlock {
  tag: string;
  title: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
  imagePosition: "left" | "right";
  imageObjectPosition?: "top" | "center" | "bottom";
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
  label: string;
  videosPerDay: number;
  videosPerMonth: number;
  estimatedAmount: number;
  breakdown: Array<{ label: string; delivered: number; rate: number; subtotal: number }>;
}

export interface RateSheetRow {
  key: string;
  label: string;
  ratePerVideo: number;
  isPlaceholder: boolean;
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
    cta: { label: string; href: "/apply" };
    hint: string;
  };
  rates: {
    title: string;
    subtitle: string;
    rows: RateSheetRow[];
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
  const rates = await repository.listRates();
  const activeRates = rates.filter((rate) => !rate.isPlaceholder);
  const activeVideoTypes = VIDEO_TYPES.filter((videoType) =>
    activeRates.some((rate) => rate.videoType === videoType)
  );

  const rateRows: RateSheetRow[] = activeVideoTypes.map((videoType) => {
    const rate = activeRates.find((item) => item.videoType === videoType);
    return {
      key: videoType,
      label: VIDEO_TYPE_LABELS[videoType],
      ratePerVideo: rate?.ratePerVideo ?? 0,
      isPlaceholder: false
    };
  });

  // Illustrative creator profiles showing realistic monthly earnings.
  const scenarioPaces = [
    { label: "Rythme progressif", videosPerDay: 1 },
    { label: "Rythme solide", videosPerDay: 2 },
    { label: "Rythme intensif", videosPerDay: 3 }
  ];

  const earningsScenarios: EarningsScenario[] = scenarioPaces.map((scenario) => {
    const videosPerMonth = scenario.videosPerDay * 30;
    // Distribute evenly across active video types for the example.
    const activeTypeCount = activeVideoTypes.length;
    const perType = activeTypeCount > 0 ? Math.floor(videosPerMonth / activeTypeCount) : 0;
    const remainder = activeTypeCount > 0 ? videosPerMonth % activeTypeCount : 0;
    const delivered = Object.fromEntries(VIDEO_TYPES.map((vt) => [vt, 0])) as Record<(typeof VIDEO_TYPES)[number], number>;
    activeVideoTypes.forEach((vt, i) => {
      delivered[vt] = perType + (i < remainder ? 1 : 0);
    });

    const payout = calculatePayout(delivered, activeRates);
    return {
      label: scenario.label,
      videosPerDay: scenario.videosPerDay,
      videosPerMonth,
      estimatedAmount: payout.total,
      breakdown: payout.items.map((item) => ({
        label: VIDEO_TYPE_LABELS[item.key as keyof typeof VIDEO_TYPE_LABELS],
        delivered: item.delivered,
        rate: item.rate,
        subtotal: item.subtotal
      }))
    };
  });

  return {
    /* ---- A — ATTENTION\u00a0: Stopper le scroll, se sentir vu ------------ */
    hero: {
      kicker: "Programme Cr\u00e9ateurs RetroMuscle",
      title: "Tu filmes d\u00e9j\u00e0. Maintenant tu es pay\u00e9 pour \u00e7a.",
      subtitle:
        "Tes rushes bruts suffisent. Pas de montage, pas de quota, aucun minimum d\u2019abonn\u00e9s. Tu produis quand tu veux, tu encaisses chaque mois.",
      primaryCta: { label: "Je veux \u00eatre pay\u00e9", href: "/apply" },
      visuals: {
        logoUrl: BRAND_ASSETS.logo,
        primaryImageUrl: BRAND_ASSETS.heroLifestyle,
        secondaryImageUrl: BRAND_ASSETS.heroVertical,
        productImageUrls: [...BRAND_ASSETS.productShots]
      }
    },

    /* ---- I — INTEREST\u00a0: Montrer la simplicit\u00e9 ---------------------- */
    flow: {
      title: "Simple. Direct. R\u00e9mun\u00e9r\u00e9.",
      subtitle: "Trois \u00e9tapes entre toi et ton premier virement.",
      steps: [
        {
          step: 1,
          title: "Tu candidates",
          description: "Remplis le formulaire en 2 minutes. On regarde ton profil et ton \u00e9nergie, pas ton nombre d\u2019abonn\u00e9s. R\u00e9ponse sous 48\u00a0h."
        },
        {
          step: 2,
          title: "Tu filmes et tu upload",
          description: "Tu filmes tes rushes, pas besoin de monter. Tu upload le raw footage sur la plateforme et tu choisis le type. On s\u2019occupe du montage, on valide sous 48\u00a0h."
        },
        {
          step: 3,
          title: "Tu encaisses",
          description: "Chaque vid\u00e9o valid\u00e9e d\u00e9clenche un paiement au tarif fixe de son type. Virement mensuel sur IBAN, PayPal ou Stripe."
        }
      ]
    },

    /* ---- I \u2192 D\u00a0: Confiance (bloc 1) + D\u00e9sir (bloc 2) --------------- */
    imageTextBlocks: [
      {
        tag: "La fin des collabs fant\u00f4mes",
        title: "Des marques qui paient \u00e0 la livraison, \u00e7a existe. On en fait partie.",
        body: "Tu connais le sch\u00e9ma\u00a0: une DM enthousiaste, des promesses vagues, et puis le silence. Ou le paiement qui tarde. RetroMuscle fonctionne autrement. Tarifs affich\u00e9s, validation sous 48\u00a0h, virement chaque mois. On a construit \u00e7a pour les cr\u00e9ateurs s\u00e9rieux.",
        imageUrl: BRAND_ASSETS.lifestyleDetail,
        imageAlt: "Cr\u00e9ateurs RetroMuscle dans une salle de sport r\u00e9tro",
        imagePosition: "left",
        bullets: [
          "Tarifs affich\u00e9s\u00a0: tu sais combien tu touches avant de filmer",
          "Validation sous 48\u00a0h, pas d\u2019attente interminable",
          "Virement mensuel sur IBAN, PayPal ou Stripe"
        ]
      },
      {
        tag: "Ton contenu vaut de l\u2019argent",
        title: "Pendant que tu postes pour rien, d\u2019autres cr\u00e9ateurs re\u00e7oivent un virement chaque mois.",
        body: "Chez RetroMuscle, tu ne cr\u00e9es pas gratuitement en \u00e9change d\u2019un code promo. Chaque vid\u00e9o valid\u00e9e d\u00e9clenche un paiement r\u00e9el. Aucun minimum d\u2019abonn\u00e9s, aucun quota \u00e0 respecter. Juste toi, ton contenu, et un virement qui arrive.",
        imageUrl: BRAND_ASSETS.lifestyleProduct,
        imageAlt: "Cr\u00e9ateur RetroMuscle consultant ses revenus",
        imagePosition: "right",
        imageObjectPosition: "top",
        cta: { label: "Voir les tarifs et postuler", href: "/apply" }
      }
    ],

    /* ---- D — D\u00c9SIR\u00a0: Chiffres concrets -------------------------------- */
    earnings: {
      title: "Ce que gagnent nos cr\u00e9ateurs.",
      subtitle: "Visualise tes revenus a partir d'un rythme simple: videos validees par jour, puis conversion mensuelle.",
      scenarios: earningsScenarios,
      cta: { label: "Je postule maintenant", href: "/apply" },
      hint: "Plus ton rythme de videos validees est regulier, plus ton revenu mensuel grimpe."
    },

    rates: {
      title: "Tarif par type de vid\u00e9o",
      subtitle: "Prix affich\u00e9s \u00e0 l\u2019avance. Chaque vid\u00e9o valid\u00e9e est pay\u00e9e au tarif du type choisi au moment de l\u2019upload.",
      rows: rateRows
    },

    qualifier: {
      sectionTitle: "Ce programme n\u2019est pas pour tout le monde.",
      imageUrl: BRAND_ASSETS.lifestyleGym,
      imageAlt: "Cr\u00e9ateur filmant du contenu fitness dans une salle de sport",
      forWhoLabel: "C\u2019est fait pour toi si",
      forWho: [
        "Tu cr\u00e9es du contenu fitness r\u00e9guli\u00e8rement, m\u00eame avec un petit compte",
        "Tu veux un vrai revenu, pas un code promo \u00e0 10\u00a0%",
        "Tu kiffes l\u2019univers r\u00e9tro et tu veux bosser avec une marque qui te ressemble"
      ],
      notForWhoLabel: "Ce n\u2019est pas fait pour toi si",
      notForWho: [
        "Tu veux recevoir des v\u00eatements gratuits sans rien cr\u00e9er",
        "Tu ne sais pas filmer et tu ne veux pas apprendre",
        "Tu cherches un partenariat passif. Ici, on paie ceux qui produisent"
      ]
    },

    /* ---- A — ACTION\u00a0: Lever les derni\u00e8res objections ----------------- */
    faqs: [
      {
        question: "J\u2019ai pas beaucoup d\u2019abonn\u00e9s, \u00e7a marche quand m\u00eame\u00a0?",
        answer: "Oui. On se fiche de ton nombre d\u2019abonn\u00e9s. Ce qu\u2019on valide, c\u2019est la qualit\u00e9 de ta vid\u00e9o, pas ta notori\u00e9t\u00e9. Des cr\u00e9ateurs avec moins de 500 abonn\u00e9s sont d\u00e9j\u00e0 pay\u00e9s dans le programme."
      },
      {
        question: "Combien je peux gagner par mois\u00a0?",
        answer: "Il n'y a aucun plafond. Chaque video validee est payee au tarif actif de son type. Ton revenu mensuel depend donc directement de ton rythme de videos validees."
      },
      {
        question: "Y a-t-il un engagement ou un minimum\u00a0?",
        answer: "Aucun. Tu upload quand tu veux, autant que tu veux, ou rien du tout pendant un mois. Pas de deadline, pas de p\u00e9nalit\u00e9. Tu produis \u00e0 ton rythme."
      },
      {
        question: "Comment se passe la validation\u00a0?",
        answer: "Tu upload tes rushes bruts et tu choisis le type. Pas besoin de monter, on s\u2019en charge. Notre \u00e9quipe review sous 48\u00a0h. Si c\u2019est valid\u00e9, le paiement est programm\u00e9. En cas de refus, tu re\u00e7ois un retour clair pour corriger et re-uploader."
      },
      {
        question: "Quand et comment je suis pay\u00e9\u00a0?",
        answer: "Les virements sont effectu\u00e9s une fois par mois pour toutes les vid\u00e9os valid\u00e9es. Tu choisis ton mode de paiement\u00a0: IBAN, PayPal ou Stripe."
      },
      {
        question: "\u00c7a m\u2019engage \u00e0 quoi si je rejoins\u00a0?",
        answer: "\u00c0 rien. L\u2019inscription est gratuite. Tu cr\u00e9es quand tu as envie, tu arr\u00eates quand tu veux. La seule chose que tu risques, c\u2019est de regretter de ne pas avoir essay\u00e9 plus t\u00f4t."
      }
    ],

    /* ---- A — ACTION\u00a0: Cl\u00f4ture inspirante ----------------------------- */
    action: {
      title: "Ton contenu m\u00e9rite d\u2019\u00eatre pay\u00e9.",
      subtitle: "Postule en 2 minutes. R\u00e9ponse sous 48\u00a0h. Aucun engagement.",
      cta: {
        label: "Je rejoins le programme",
        href: "/apply"
      }
    }
  };
}
