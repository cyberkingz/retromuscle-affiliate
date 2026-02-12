import type { Metadata } from "next";

import { BRAND_ASSETS } from "@/domain/constants/brand-assets";

const DEFAULT_SITE_URL = "https://retromuscle.net";

export function createPageMetadata(input: {
  title: string;
  description: string;
  path: `/${string}` | "";
  imageUrl?: string;
  noIndex?: boolean;
}): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
  const imageUrl = input.imageUrl ?? BRAND_ASSETS.heroLifestyle;

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: input.path
    },
    ...(input.noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: input.title,
      description: input.description,
      url: `${siteUrl}${input.path}`,
      siteName: "RetroMuscle",
      type: "website",
      images: [{ url: imageUrl }]
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [imageUrl]
    }
  };
}

