import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { allClubs, clubSlug } from "@/lib/teamdb";
import { clubColors, clubAbbr } from "@/lib/clubs";

export const metadata = pageMeta({
  title: "NRL & NRLW Clubs — every team's record & roster",
  description: "Browse every NRL and NRLW club: season-by-season ladder finishes, all-time win record, and each club's top-rated players, built from real match data.",
  path: "/teams",
  keywords: ["NRL clubs", "NRL teams", "NRL team stats", "NRL club records"],
});

export default function TeamsPage() {
  const clubs = allClubs("nrl");
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase" }}>Clubs</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>
          Every club&rsquo;s season-by-season record and top players. Switch to NRLW in the header.
        </p>
      </header>
      <div className="grid-cards">
        {clubs.map((club) => {
          const [c1, c2] = clubColors(club);
          return (
            <Link key={club} href={`/teams/${clubSlug(club)}`} className="card"
              style={{ padding: 0, overflow: "hidden", display: "grid" }}>
              <div style={{ height: 6, background: `linear-gradient(90deg, ${c1}, ${c2})` }} />
              <div style={{ padding: "1rem", display: "flex", gap: 12, alignItems: "center" }}>
                <span aria-hidden style={{
                  width: 40, height: 40, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center",
                  background: c1, color: "#fff", fontFamily: "var(--font-cond)", fontSize: ".9rem", fontWeight: 800,
                  boxShadow: `inset 0 0 0 2px ${c2}`,
                }}>{clubAbbr(club)}</span>
                <strong>{club}</strong>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
