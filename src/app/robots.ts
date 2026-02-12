import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://retromuscle.net";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/onboarding", "/contract", "/settings", "/uploads", "/payouts", "/api/"]
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
