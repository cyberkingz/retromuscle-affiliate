import { BRAND_ASSETS } from "@/domain/constants/brand-assets";

export interface ApplyMarketingData {
  heroImageUrl?: string;
  attention: {
    badge: string;
    headline: string;
    supportingText: string;
  };
  interestPoints: string[];
  socialProof: {
    stats: Array<{ label: string; value: string }>;
    creators: Array<{ name: string; niche: string; quote: string }>;
    trustedBy: string[];
  };
  desire: {
    title: string;
    bullets: string[];
  };
  action: {
    urgencyText: string;
    reassurance: string;
  };
}

export interface ApplyPageData {
  marketing: ApplyMarketingData;
}

export async function getApplyPageData(): Promise<ApplyPageData> {
  return {
    marketing: {
      heroImageUrl: BRAND_ASSETS.heroLifestyle,
      attention: {
        badge: "Programme Createur 2026",
        headline: "Tu filmes deja. Maintenant tu es paye pour ca.",
        supportingText:
          "Postule en 2 minutes. Si ton profil est valide, tu upload tes videos et tu es paye pour chaque contenu accepte. Aucun quota, aucune limite."
      },
      interestPoints: [
        "Tarif fixe par video : 95 a 180 EUR",
        "Aucun quota, tu produis a ton rythme",
        "Paiement mensuel des contenus valides"
      ],
      socialProof: {
        stats: [
          { label: "Reponse", value: "Sous 48h" },
          { label: "Par video", value: "95-180 EUR" },
          { label: "Plafond", value: "Aucun" }
        ],
        creators: [
          {
            name: "Yasmine",
            niche: "Fitness & lifestyle",
            quote: "J\u2019avais 800 abonn\u00e9s quand j\u2019ai postul\u00e9. Ils m\u2019ont accept\u00e9e en 24h. Premier virement re\u00e7u le mois suivant."
          },
          {
            name: "Th\u00e9o",
            niche: "Musculation",
            quote: "Z\u00e9ro prise de t\u00eate. Tu filmes tes rushes, tu upload, c\u2019est pay\u00e9. Pas de brief \u00e0 rallonge, pas de relance."
          },
          {
            name: "Ma\u00ebva",
            niche: "Crossfit & HIIT",
            quote: "En un mois j\u2019ai touch\u00e9 plus qu\u2019avec mes 3 derni\u00e8res collabs r\u00e9unies. Et l\u00e0 c\u2019\u00e9tait juste du raw footage."
          },
          {
            name: "Karim",
            niche: "Streetworkout",
            quote: "Le programme est honn\u00eate\u00a0: les tarifs sont affich\u00e9s, la validation est rapide, et le virement tombe chaque mois."
          },
          {
            name: "Lola",
            niche: "Yoga & bien-\u00eatre",
            quote: "Pas besoin d\u2019un gros compte. Ils veulent du bon contenu, pas des millions de followers. \u00c7a change tout."
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
