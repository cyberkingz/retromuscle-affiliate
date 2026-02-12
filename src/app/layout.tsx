import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Barlow_Condensed, Space_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "@/app/globals.css";
import { Providers } from "@/app/providers";
import { BRAND_ASSETS } from "@/domain/constants/brand-assets";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://retromuscle.net";
const SITE_NAME = "RetroMuscle";

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
    siteName: SITE_NAME,
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#061136"
};

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: BRAND_ASSETS.logo
    },
    {
      "@type": "WebSite",
      name: `${SITE_NAME} Programme Affilie`,
      url: SITE_URL,
      publisher: {
        "@type": "Organization",
        name: SITE_NAME
      }
    }
  ]
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="fr">
      <body className={`${fontDisplay.variable} ${fontBody.variable}`}>
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
