import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NRL 24-0 — All-Time Team Builder",
    short_name: "NRL 24-0",
    description: "Build an all-time NRL side and chase a perfect 24-0 season.",
    start_url: "/",
    display: "standalone",
    background_color: "#060d0a",
    theme_color: "#060d0a",
    orientation: "portrait",
    categories: ["games", "sports"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
