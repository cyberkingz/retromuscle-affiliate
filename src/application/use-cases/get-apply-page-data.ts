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
          { label: "Createurs actifs", value: "50+" },
          { label: "Taux acceptance", value: "90%" },
          { label: "Cycle moyen", value: "<30 jours" }
        ],
        creators: [
          {
            name: "Emma",
            niche: "OOTD / Training",
            quote: "Je sais ce que je dois livrer et je peux enfin prevoir mes revenus."
          },
          {
            name: "Marc",
            niche: "Performance / Storytelling",
            quote: "J'ai un rythme de missions plus stable au lieu de collaborations one-shot."
          }
        ],
        trustedBy: ["RetroMuscle", "Athletes Squad", "Creator Partners", "Performance Team"]
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
        reassurance: "Tu peux sauvegarder ton dossier et revenir quand tu veux avant envoi final."
      }
    }
  };
}
