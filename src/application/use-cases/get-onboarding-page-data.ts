import { getRepository } from "@/application/dependencies";

export interface OnboardingPageData {
  steps: Array<{ title: string; fields: string[] }>;
  packages: Array<{ tier: number; quotaVideos: number; monthlyCredits: number }>;
  mixes: Array<{ name: string; positioning: string }>;
}

export async function getOnboardingPageData(): Promise<OnboardingPageData> {
  const repository = getRepository();
  const [packages, mixes] = await Promise.all([
    repository.listPackageDefinitions(),
    repository.listMixDefinitions()
  ]);

  return {
    steps: [
      {
        title: "Informations personnelles",
        fields: ["Nom createur", "Email", "WhatsApp", "Pays", "Adresse livraison"]
      },
      {
        title: "Profil createur",
        fields: ["Liens TikTok/Instagram", "Followers", "Portfolio"]
      },
      {
        title: "Selection initiale",
        fields: ["Package mensuel", "Mix video par defaut"]
      }
    ],
    packages: packages.map((pkg) => ({
      tier: pkg.tier,
      quotaVideos: pkg.quotaVideos,
      monthlyCredits: pkg.monthlyCredits
    })),
    mixes: mixes.map((mix) => ({
      name: mix.name,
      positioning: mix.positioning
    }))
  };
}
