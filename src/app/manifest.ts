import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Payonidhi Dairy", short_name: "Payonidhi", description: "Mobile-first milk delivery register", start_url: "/", display: "standalone", background_color: "#ffffff", theme_color: "#0f766e", icons: [] };
}
