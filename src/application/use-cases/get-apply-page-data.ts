import type { ApplyMarketingData } from "@/features/apply/types";
import { BRAND_ASSETS } from "@/domain/constants/brand-assets";

export interface ApplyPageData {
  marketing: ApplyMarketingData;
}

export async function getApplyPageData(): Promise<ApplyPageData> {
  return {
    marketing: {
      heroImageUrl: BRAND_ASSETS.heroLifestyle,
      attention: {
        badge: "Programme Affilie 2026",
        headline: "Entre dans le programme affilie RetroMuscle et transforme ton contenu en revenu recurrent.",
        supportingText:
          "Postule en 3 minutes. Si ton profil est valide, tu recois des missions mensuelles avec un paiement clair."
      },
      interestPoints: [
        "Des missions prêtes chaque mois",
        "Un cadre simple pour filmer sans stress",
        "Paiement mensuel des contenus valides"
      ],
      socialProof: {
        stats: [
          { label: "Reponse", value: "Sous 48h" },
          { label: "Missions", value: "Mensuel" },
          { label: "Paiement", value: "Mensuel" }
        ],
        creators: [
          {
            name: "Emma",
            niche: "OOTD / Training",
            quote: "Je sais ce que je dois livrer et je peux enfin prevoir mes revenus."
          },
          {
            name: "Marc",
            niche: "Performance",
            quote: "J'ai un rythme de missions stable au lieu de collabs one-shot."
          },
          {
            name: "Julie",
            niche: "Lifestyle",
            quote: "Le process est pro: brief clair, validation rapide et paiement ok."
          },
          {
            name: "Lucas",
            niche: "Workout",
            quote: "Simple, efficace. On se concentre sur la creation, pas la negociation."
          },
          {
            name: "Sarah",
            niche: "Gymwear",
            quote: "J'adore l'ambiance RetroMuscle, c'est vraiment une communaute."
          }
        ],
        trustedBy: []
      },
      desire: {
        title: "Ce que tu gagnes concretement",
        bullets: [
          "Plus de regularite dans tes rentrees d'argent",
          "Moins de temps perdu en allers-retours",
          "Un programme humain qui t'aide a durer"
        ]
      },
      action: {
        urgencyText: "Les places sont ouvertes chaque semaine selon les besoins campagnes.",
        reassurance: "Dossier a soumettre a la derniere etape. Pas de brouillon."
      }
    }
  };
}
