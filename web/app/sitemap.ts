import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";
import { notablePlayers } from "@/lib/playerdb";

export const dynamic = "force-static";

const GAMES = [
  "invincibles", "footle", "higher-or-lower", "guess-the-player",
  "career-path", "beat-the-clock", "score-predictor",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const top: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, priority: 1, changeFrequency: "weekly", lastModified: now },
    { url: `${SITE.url}/play/`, priority: 0.9, changeFrequency: "weekly", lastModified: now },
    { url: `${SITE.url}/games/`, priority: 0.8, changeFrequency: "weekly", lastModified: now },
    { url: `${SITE.url}/ladder/`, priority: 0.8, changeFrequency: "daily", lastModified: now },
    { url: `${SITE.url}/players/`, priority: 0.8, changeFrequency: "weekly", lastModified: now },
    { url: `${SITE.url}/fixtures/`, priority: 0.7, changeFrequency: "daily", lastModified: now },
    { url: `${SITE.url}/stats/`, priority: 0.7, changeFrequency: "weekly", lastModified: now },
    { url: `${SITE.url}/leaderboard/`, priority: 0.6, changeFrequency: "daily", lastModified: now },
    { url: `${SITE.url}/about/`, priority: 0.5, changeFrequency: "monthly", lastModified: now },
  ];
  const games: MetadataRoute.Sitemap = GAMES.map((g) => ({
    url: `${SITE.url}/games/${g}/`,
    priority: 0.7,
    changeFrequency: "weekly",
    lastModified: now,
  }));
  const players: MetadataRoute.Sitemap = notablePlayers().map((p) => ({
    url: `${SITE.url}/players/${p.id}/${p.slug}/`,
    priority: 0.5,
    changeFrequency: "weekly",
    lastModified: now,
  }));
  return [...top, ...games, ...players];
}
