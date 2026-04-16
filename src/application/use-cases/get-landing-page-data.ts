import { VIDEO_TYPE_LABELS } from "@/domain/constants/labels";
import { getCachedRates } from "@/application/use-cases/get-cached-rates";

export interface LandingPageData {
  hero: {
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: "/apply";
  };
  videoRates: Array<{
    videoType: string;
    ratePerVideo: number;
    isPlaceholder: boolean;
  }>;
  goals: Array<{ label: string; metric: string }>;
  testimonials: Array<{ author: string; role: string; quote: string }>;
  faq: Array<{ question: string; answer: string }>;
}

export async function getLandingPageData(): Promise<LandingPageData> {
  const rates = await getCachedRates();
  const activeRates = rates.filter((rate) => !rate.isPlaceholder);

  return {
    hero: {
      title: "Tu filmes d\u00e9j\u00e0. Maintenant tu es pay\u00e9 pour \u00e7a.",
      subtitle:
        "Envoie tes rushes, choisis le type de contenu, et sois paye au tarif actif affiche dans ton espace. Pas besoin de monter, on s'en charge. Pas de quota, pas de deadline.",
      ctaLabel: "Je veux \u00eatre pay\u00e9",
      ctaHref: "/apply"
    },
    videoRates: activeRates.map((rate) => ({
      videoType: VIDEO_TYPE_LABELS[rate.videoType],
      ratePerVideo: rate.ratePerVideo,
      isPlaceholder: rate.isPlaceholder
    })),
    goals: [
      { label: "Quota minimum", metric: "Z\u00e9ro" },
      { label: "Par vid\u00e9o valid\u00e9e", metric: "Tarif actif par type" },
      { label: "Plafond de gains", metric: "Illimit\u00e9" },
      { label: "Validation sous", metric: "48\u00a0h" }
    ],
    testimonials: [],
    faq: [
      {
        question:
          "J\u2019ai pas beaucoup d\u2019abonn\u00e9s, \u00e7a marche quand m\u00eame\u00a0?",
        answer:
          "Oui. On se fiche de ton nombre d\u2019abonn\u00e9s. Ce qu\u2019on valide, c\u2019est la qualit\u00e9 de ta vid\u00e9o, pas ta notori\u00e9t\u00e9. Si tu sais filmer, cadrer, et que ton contenu colle \u00e0 l\u2019univers RetroMuscle, tu es pay\u00e9."
      },
      {
        question: "Comment je suis pay\u00e9, et quand\u00a0?",
        answer:
          "Chaque vid\u00e9o valid\u00e9e par l\u2019\u00e9quipe d\u00e9clenche le paiement au tarif de son type. Les virements sont effectu\u00e9s chaque mois, directement sur ton IBAN ou PayPal."
      },
      {
        question: "Y a-t-il un engagement ou un quota minimum\u00a0?",
        answer:
          "Non. Aucun quota, aucun engagement, aucune deadline. Tu upload une vid\u00e9o cette semaine, puis rien pendant un mois, puis dix vid\u00e9os d\u2019un coup. C\u2019est toi qui d\u00e9cides."
      },
      {
        question: "Combien je peux gagner par mois\u00a0?",
        answer:
          "Il n'y a aucun plafond. Chaque video validee est payee au tarif actif de son type. Ton revenu mensuel depend directement de ton rythme de videos validees."
      },
      {
        question: "Comment \u00e7a marche concr\u00e8tement\u00a0?",
        answer:
          "Tu candidates en 2 minutes. Ton profil est valid\u00e9 sous 48\u00a0h. Ensuite tu acc\u00e8des \u00e0 ton espace cr\u00e9ateur, tu upload tes rushes bruts, tu choisis le type, et l\u2019\u00e9quipe review sous 48\u00a0h. Pas besoin de monter, on g\u00e8re. Chaque vid\u00e9o valid\u00e9e est pay\u00e9e."
      },
      {
        question:
          "Qu\u2019est-ce qui fait qu\u2019une vid\u00e9o est valid\u00e9e ou rejet\u00e9e\u00a0?",
        answer:
          "On valide les rushes qui respectent les specs techniques (r\u00e9solution, ratio, dur\u00e9e) et l\u2019univers RetroMuscle (\u00e9nergie, authenticit\u00e9, esth\u00e9tique). Pas besoin de monter, on s\u2019en charge. En cas de rejet, tu re\u00e7ois un retour clair pour corriger."
      }
    ]
  };
}
