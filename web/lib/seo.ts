import type { Metadata } from "next";

export const SITE = {
  name: "NRL 24-0",
  domain: "nrl24-0.com",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://nrl24-0.com",
  tagline:
    "Build an all-time NRL side and chase a perfect 24-0 season — plus rugby-league mini-games, ladders and stats.",
  description:
    "Spin for an NRL club and era, draft a legend into every position and chase a flawless 24-0 season. Plus a vault of rugby-league mini-games — Footle, Higher or Lower, Guess the Player, Career Path, Beat the Clock and Score Predictor — with ladders, fixtures, stats and player profiles. Player ratings built from real Champion Data match stats.",
  twitter: "@nrl240",
};

/** Build page metadata with sensible SEO defaults + Open Graph/Twitter cards. */
export function pageMeta(opts: {
  title: string;
  description?: string;
  path?: string;
  keywords?: string[];
  image?: string;
}): Metadata {
  const url = SITE.url + (opts.path ?? "");
  const description = opts.description ?? SITE.description;
  const title = opts.title;
  return {
    title,
    description,
    keywords: opts.keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE.name,
      type: "website",
      images: opts.image ? [{ url: opts.image }] : undefined,
      locale: "en_AU",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: SITE.twitter,
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: SITE.url + it.path,
    })),
  };
}
