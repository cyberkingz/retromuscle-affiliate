import type { Metadata } from "next";
import { Barlow_Condensed, Space_Mono } from "next/font/google";

import "@/app/globals.css";
import { Providers } from "@/app/providers";
import { BRAND_ASSETS } from "@/domain/constants/brand-assets";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://retromuscle.net";

const fontDisplay = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800"],
  style: ["italic", "normal"],
  variable: "--font-display",
  display: "swap"
});

// RetroMuscle storefront leans on a monospace body font for a more "editorial" feel.
// We keep a condensed display font for headlines and a mono body for UI copy.
const fontBody = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "RetroMuscle Programme Affilie",
  description: "Rejoins le programme affilie RetroMuscle et transforme ton contenu en revenu mensuel regulier.",
  openGraph: {
    title: "RetroMuscle Programme Affilie",
    description: "Programme d'affiliation RetroMuscle pour createurs: missions mensuelles, validation rapide, paiements reguliers.",
    url: SITE_URL,
    siteName: "RetroMuscle",
    type: "website",
    images: [{ url: BRAND_ASSETS.heroLifestyle }]
  },
  twitter: {
    card: "summary_large_image",
    title: "RetroMuscle Programme Affilie",
    description: "Programme d'affiliation RetroMuscle pour createurs: missions mensuelles, validation rapide, paiements reguliers.",
    images: [BRAND_ASSETS.heroLifestyle]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${fontDisplay.variable} ${fontBody.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
