import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import SisterSites from "@/components/SisterSites";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import AdUnit from "@/components/AdUnit";
import { AD_CLIENT, AD_SLOTS } from "@/lib/ads";
import { SITE } from "@/lib/seo";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // draw into the notch / dynamic island
  themeColor: "#060d0a",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "NRL 24-0 — Build the perfect all-time NRL team",
    template: "%s — NRL 24-0",
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "NRL", "NRL game", "rugby league game", "NRL team builder", "all-time NRL team",
    "24-0", "perfect season", "NRL fantasy", "NRL trivia", "rugby league quiz",
    "NRL legends", "Dally M", "NRL ladder", "NRL stats", "Footle NRL",
  ],
  authors: [{ name: "Daniel Tomaro" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: SITE.name,
    title: "NRL 24-0 — Build the perfect all-time NRL team",
    description: SITE.description,
    locale: "en_AU",
  },
  twitter: {
    card: "summary_large_image",
    title: "NRL 24-0 — Build the perfect all-time NRL team",
    description: SITE.description,
    site: SITE.twitter,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  appleWebApp: {
    capable: true,
    title: "NRL 24-0",
    statusBarStyle: "black-translucent",
  },
  manifest: "/manifest.webmanifest",
  other: {
    // Google AdSense site-verification meta tag (emitted into the static <head>)
    "google-adsense-account": AD_CLIENT,
  },
};

const orgLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  inLanguage: "en-AU",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE.url}/players?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};
const orgLdEntity = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE.url}/#org`,
  name: SITE.name,
  url: SITE.url,
  logo: { "@type": "ImageObject", url: `${SITE.url}/icon.svg` },
  sameAs: ["https://afl23-0.com", "https://footballinvincibles.com"],
};
const appLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE.name,
  url: SITE.url,
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  publisher: { "@id": `${SITE.url}/#org` },
  offers: { "@type": "Offer", price: "0", priceCurrency: "AUD" },
  inLanguage: "en-AU",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body>
        <SisterSites active="nrl" />
        <SiteHeader />
        <main className="container-x" style={{ paddingTop: "1.5rem", minHeight: "60vh" }}>
          {children}
        </main>
        <div className="container-x">
          <AdUnit slot={AD_SLOTS.inline} />
        </div>
        <SiteFooter />
        <JsonLd data={orgLdEntity} />
        <JsonLd data={orgLd} />
        <JsonLd data={appLd} />
        {/* Warm up the third-party origins used on every page so the ad +
            analytics requests skip the DNS/TLS round-trips. */}
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://static.cloudflareinsights.com" />
        <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />
        <link rel="dns-prefetch" href="https://tpc.googlesyndication.com" />
        {/* Google AdSense loader — a literal <script> (React hoists it into
            <head>) so the AdSense crawler sees the real snippet, not a preload */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`}
          crossOrigin="anonymous"
        />
        {/* Cloudflare Web Analytics — privacy-friendly, no cookies */}
        <Script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          strategy="afterInteractive"
          data-cf-beacon='{"token": "4d55fdcc7b524f92885f31490208e4b2"}'
        />
      </body>
    </html>
  );
}
