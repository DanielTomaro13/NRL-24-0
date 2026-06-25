import Link from "next/link";
import SuperCoachNav from "@/components/supercoach/SuperCoachNav";
import { loadSuperCoach } from "@/lib/model.server";

export default async function SuperCoachLayout({ children }: { children: React.ReactNode }) {
  const sc = await loadSuperCoach();
  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <header style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "2rem", margin: 0, textTransform: "uppercase", fontFamily: "var(--font-cond)" }}>
            <Link href="/supercoach" style={{ color: "var(--text)" }}>SuperCoach</Link>
          </h1>
          <span className="chip" style={{ color: "var(--gold)" }}>{sc.round ? `Round ${sc.round}` : "NRL"}</span>
        </div>
        <p style={{ color: "var(--muted)", margin: 0, maxWidth: "62ch", fontSize: ".95rem" }}>
          Live NRL SuperCoach prices, projections, form, ownership and matchups for every player.
          An independent stats resource — not affiliated with SuperCoach or the NRL.
        </p>
        <SuperCoachNav />
      </header>
      {children}
    </div>
  );
}
