import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RetroMuscle Programme Affilie",
    short_name: "RetroMuscle",
    description: "Programme d'affiliation RetroMuscle pour createurs",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#061136",
    icons: [
      { src: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  };
}
