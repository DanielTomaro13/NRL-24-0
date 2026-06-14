import Link from "next/link";
import { breadcrumbJsonLd, SITE } from "@/lib/seo";
import type { ProfilePlayer } from "@/lib/games-data";
import { compLabel, type Comp } from "@/lib/comp";
import { clubColors } from "@/lib/clubs";
import { POS_GROUP } from "@/lib/format";
import JsonLd from "@/components/JsonLd";

/** Shared player profile, used by both the NRL and NRLW profile routes. */
export default function PlayerProfile({ p, comp }: { p: ProfilePlayer; comp: Comp }) {
  const [c1, c2] = clubColors(p.club);
  const L = compLabel(comp);
  const base = comp === "nrlw" ? "/w/players" : "/players";

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    jobTitle: `${p.posName} (rugby league)`,
    affiliation: { "@type": "SportsTeam", name: p.club },
    url: `${SITE.url}${base}/${p.id}/${p.slug}`,
  };
  const stat = (label: string, value: string | number) => (
    <div style={{ padding: ".7rem .9rem", background: "var(--panel-2)", borderRadius: 10, textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-cond)", fontSize: "1.5rem" }}>{value}</div>
      <div style={{ fontSize: ".66rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
    </div>
  );

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <JsonLd data={personLd} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Players", path: "/players" }, { name: p.name, path: `${base}/${p.id}/${p.slug}` }])} />
      <nav style={{ fontSize: ".82rem" }}><Link href="/players" style={{ color: "var(--accent)" }}>← All players</Link></nav>
      <header className="card" style={{ padding: "1.25rem", borderTop: `3px solid ${c1}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "2rem" }}>{p.name}</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, color: "var(--muted)" }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: c1, border: `1px solid ${c2}` }} />
              {p.club} · {p.posName} · {POS_GROUP[p.pos]} · {L}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-cond)", fontSize: "3rem", lineHeight: 1, color: p.rating >= 90 ? "var(--gold)" : "var(--text)" }}>{p.rating}</div>
            <div style={{ fontSize: ".66rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>24-0 rating</div>
          </div>
        </div>
      </header>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))" }}>
        {stat("Games", p.apps)}
        {stat("Tries", p.tries)}
        {stat("Try Assists", p.tryAssists)}
        {stat("Line Breaks", p.lineBreaks)}
        {stat("Run m/game", p.runMetres)}
        {stat("Tackles/game", p.tackles)}
        {stat("Era", `${p.firstYear}–${p.lastYear}`)}
      </div>
      <p style={{ color: "var(--muted)", fontSize: ".88rem", lineHeight: 1.6 }}>
        {p.name} is rated <strong style={{ color: "var(--text)" }}>{p.rating}</strong> in {L} 24-0 — built from {p.apps} games of
        real Champion Data match stats between {p.firstYear} and {p.lastYear}.{" "}
        <Link href="/play" style={{ color: "var(--accent)" }}>Draft {p.name.split(" ")[0]} into your perfect side →</Link>
      </p>
    </div>
  );
}
