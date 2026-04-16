export interface OnboardingPageData {
  steps: Array<{ title: string; fields: string[] }>;
}

export async function getOnboardingPageData(): Promise<OnboardingPageData> {
  return {
    steps: [
      {
        title: "Informations personnelles",
        fields: ["Nom créateur", "WhatsApp", "Pays", "Adresse livraison"]
      },
      {
        title: "Profil créateur",
        fields: ["Liens TikTok/Instagram", "Followers"]
      }
    ]
  };
}
