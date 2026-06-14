import type { Metadata, Viewport } from "next";
import "./globals.css";
import SisterSites from "@/components/SisterSites";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
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
const appLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE.name,
  url: SITE.url,
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "AUD" },
  inLanguage: "en-AU",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body>
        <SisterSites active="nrl" />
        <SiteHeader />
        <main className="container-x" style={{ paddingTop: "1.5rem", minHeight: "60vh" }}>
          {children}
        </main>
        <SiteFooter />
        <JsonLd data={orgLd} />
        <JsonLd data={appLd} />
      </body>
    </html>
  );
}
