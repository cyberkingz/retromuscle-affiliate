import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://retromuscle.net";
  const now = new Date();

  return [
    "",
    "/creators",
    "/apply",
    "/login",
    "/join"
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now
  }));
}
