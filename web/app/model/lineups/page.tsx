import { pageMeta } from "@/lib/seo";
import { loadLineups, loadModelMeta } from "@/lib/model.server";
import type { LineupSide } from "@/lib/model";

export const metadata = pageMeta({
  title: "NRL team lists — confirmed lineups this round",
  description:
    "Confirmed NRL team lists for every game this round: the named 1–17 plus bench and reserves by position, with each side's goal kicker flagged.",
  path: "/model/lineups",
  keywords: ["NRL team lists", "NRL lineups", "NRL teams this week", "NRL goal kicker"],
});

function TeamCol({ side }: { side: LineupSide }) {
  const starters = side.players.filter((p) => (p.jumper ?? 99) <= 13);
  const bench = side.players.filter((p) => (p.jumper ?? 99) >= 14 && (p.jumper ?? 99) <= 17);
  const reserves = side.players.filter((p) => (p.jumper ?? 99) > 17);
  const kicker = side.players.find((p) => p.kicker);

  const Row = ({ p }: { p: LineupSide["players"][number] }) => (
    <li style={{ display: "flex", gap: 8, alignItems: "baseline", padding: "2px 0" }}>
      <span style={{ width: 20, textAlign: "right", color: "var(--muted)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{p.jumper ?? "–"}</span>
      <span style={{ fontWeight: p.kicker ? 800 : 500 }}>{p.name}</span>
      {p.kicker ? <span title="Goal kicker" style={{ color: "var(--gold)", fontSize: ".7rem", fontWeight: 800 }}>● GK</span> : null}
      <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: ".78rem" }}>{p.position}</span>
    </li>
  );

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <h3 style={{ margin: 0, fontFamily: "var(--font-cond)", textTransform: "uppercase", fontSize: "1.05rem" }}>{side.team}</h3>
        {kicker ? <span className="chip" style={{ color: "var(--gold)", fontSize: ".66rem" }}>GK {kicker.name}</span> : null}
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: ".88rem" }}>
        {starters.map((p, i) => <Row key={i} p={p} />)}
      </ul>
      {bench.length ? (
        <>
          <div style={{ color: "var(--muted)", fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".07em", margin: "8px 0 2px" }}>Interchange</div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: ".88rem" }}>{bench.map((p, i) => <Row key={i} p={p} />)}</ul>
        </>
      ) : null}
      {reserves.length ? (
        <>
          <div style={{ color: "var(--muted)", fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".07em", margin: "8px 0 2px" }}>Reserves</div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: ".84rem", color: "var(--muted)" }}>{reserves.map((p, i) => <Row key={i} p={p} />)}</ul>
        </>
      ) : null}
    </div>
  );
}

export default async function LineupsPage() {
  const [data, meta] = await Promise.all([loadLineups(), loadModelMeta()]);
  if (!data.matches.length)
    return <p style={{ color: "var(--muted)" }}>Team lists aren’t out yet — they’re usually confirmed the day before each game.</p>;

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <p style={{ color: "var(--muted)", margin: 0, maxWidth: "72ch", fontSize: ".95rem" }}>
        Confirmed team lists{meta.round ? ` for Round ${meta.round}` : ""} — the named 1–17 plus bench and
        reserves. <span style={{ color: "var(--gold)" }}>● GK</span> marks each side’s designated goal kicker,
        the player the model anchors goal-kicking points to.
      </p>
      {data.matches.map((m) => (
        <div key={m.matchId} className="card" style={{ padding: "1rem" }}>
          <div style={{ fontFamily: "var(--font-cond)", fontWeight: 800, letterSpacing: ".02em", marginBottom: 10, color: "var(--muted)" }}>
            {m.event}
          </div>
          <div className="lineup-cols">
            <TeamCol side={m.home} />
            <TeamCol side={m.away} />
          </div>
        </div>
      ))}
    </div>
  );
}
