import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Barlow_Condensed, Space_Mono } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FacebookPixelEvents } from "@/components/system/facebook-pixel-events";
import { FB_PIXEL_ID } from "@/lib/facebook-pixel";

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
  title: "RetroMuscle Programme Créateur",
  description:
    "Tu filmes déjà du contenu fitness. Sois payé pour ça. 95 à 180 EUR par vidéo validée, sans quota ni plafond.",
  openGraph: {
    title: "RetroMuscle Programme Créateur",
    description:
      "Upload tes vidéos fitness, choisis le type, touche entre 95 et 180 EUR par vidéo validée. Aucun quota, aucun plafond.",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: BRAND_ASSETS.heroLifestyle }]
  },
  twitter: {
    card: "summary_large_image",
    title: "RetroMuscle Programme Créateur",
    description:
      "Upload tes vidéos fitness, choisis le type, touche entre 95 et 180 EUR par vidéo validée. Aucun quota, aucun plafond.",
    images: [BRAND_ASSETS.heroLifestyle]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#061136"
};

const STRUCTURED_DATA_JSON = JSON.stringify({
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
      name: `${SITE_NAME} Programme Créateur`,
      url: SITE_URL,
      publisher: {
        "@type": "Organization",
        name: SITE_NAME
      }
    }
  ]
});

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="fr">
      <body className={`${fontDisplay.variable} ${fontBody.variable}`}>
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: STRUCTURED_DATA_JSON }}
        />
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />

        {/* ── Meta Pixel ── */}
        {FB_PIXEL_ID ? (
          <>
            <Script id="fb-pixel" strategy="afterInteractive" nonce={nonce}>
              {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${FB_PIXEL_ID}');
fbq('track','PageView');`}
            </Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
            {/* PageView on every client-side route change */}
            <Suspense fallback={null}>
              <FacebookPixelEvents />
            </Suspense>
          </>
        ) : null}
      </body>
    </html>
  );
}
