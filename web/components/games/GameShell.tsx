import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import AdUnit from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";
import { SITE } from "@/lib/seo";

/** Server wrapper giving every game a consistent, SEO-friendly frame. */
export default function GameShell({
  title, emoji, intro, howTo, children, slug,
}: {
  title: string; emoji: string; intro: string; howTo: string[];
  children: React.ReactNode; slug: string;
}) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: `${title} — NRL 24-0`,
    url: `${SITE.url}/games/${slug}/`,
    operatingSystem: "Web",
    gamePlatform: "Web browser",
    publisher: { "@id": `${SITE.url}/#org` },
    offers: { "@type": "Offer", price: "0", priceCurrency: "AUD" },
  };
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <JsonLd data={ld} />
      <nav style={{ fontSize: ".82rem", color: "var(--muted)" }}>
        <Link href="/games" style={{ color: "var(--accent)" }}>← All games</Link>
      </nav>
      <header style={{ display: "grid", gap: 6 }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, margin: 0, textTransform: "uppercase" }}>
          <span style={{ marginRight: 8 }}>{emoji}</span>{title}
        </h1>
        <p style={{ color: "var(--muted)", margin: 0, maxWidth: 680 }}>{intro}</p>
      </header>
      {children}
      <section className="card" style={{ padding: "1.25rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, marginTop: 0 }}>How to play</h2>
        <ol style={{ color: "var(--muted)", margin: 0, paddingLeft: "1.1rem", display: "grid", gap: 6 }}>
          {howTo.map((h, i) => <li key={i}>{h}</li>)}
        </ol>
      </section>
      <AdUnit slot={AD_SLOTS.game} />
    </div>
  );
}
