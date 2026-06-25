import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { loadSuperCoach } from "@/lib/model.server";
import {
  type ScPlayer, moneyK, signed, valuePer100k, formDelta, isPlaying, posColor,
} from "@/lib/supercoach";

export const metadata = pageMeta({
  title: "NRL SuperCoach — prices, projections, value & form",
  description: "The NRL SuperCoach hub: live prices, projections, biggest price movers, best value, hot form and ownership for every player.",
  path: "/supercoach",
  keywords: ["NRL SuperCoach", "SuperCoach prices", "SuperCoach value", "SuperCoach tips"],
});

export default async function ScOverview() {
  const sc = await loadSuperCoach();
  if (!sc.players.length) return <p style={{ color: "var(--muted)" }}>SuperCoach data is loading — check back shortly.</p>;
  const playing = sc.players.filter(isPlaying);
  const proj = (p: ScPlayer) => p.proj || p.avg;
  const lists = {
    topProj: [...playing].sort((a, b) => proj(b) - proj(a)).slice(0, 8),
    value: [...playing].filter((p) => p.games >= 3).sort((a, b) => valuePer100k(b) - valuePer100k(a)).slice(0, 8),
    risers: [...sc.players].sort((a, b) => b.priceChange - a.priceChange).slice(0, 8),
    fallers: [...sc.players].sort((a, b) => a.priceChange - b.priceChange).slice(0, 8),
    form: [...playing].filter((p) => p.games >= 3).sort((a, b) => formDelta(b) - formDelta(a)).slice(0, 8),
    owned: [...sc.players].sort((a, b) => b.owned - a.owned).slice(0, 8),
  };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <Card title="Top projected" href="/supercoach/players" note="Highest projected score this round">
          {lists.topProj.map((p) => <Row key={p.id} p={p} right={`${Math.round(proj(p))}`} />)}
        </Card>
        <Card title="Best value" href="/supercoach/value" note="Projected points per $100k">
          {lists.value.map((p) => <Row key={p.id} p={p} right={valuePer100k(p).toFixed(1)} />)}
        </Card>
        <Card title="Biggest risers" href="/supercoach/prices" note="This round's price change">
          {lists.risers.map((p) => <Row key={p.id} p={p} right={signed(p.priceChange)} tone={p.priceChange > 0 ? 1 : -1} />)}
        </Card>
        <Card title="Biggest fallers" href="/supercoach/prices" note="This round's price change">
          {lists.fallers.map((p) => <Row key={p.id} p={p} right={signed(p.priceChange)} tone={p.priceChange > 0 ? 1 : -1} />)}
        </Card>
        <Card title="Hot form" href="/supercoach/form" note="Last-3 average vs season">
          {lists.form.map((p) => <Row key={p.id} p={p} right={(formDelta(p) > 0 ? "+" : "") + formDelta(p).toFixed(0)} tone={formDelta(p) > 0 ? 1 : -1} />)}
        </Card>
        <Card title="Most owned" href="/supercoach/ownership" note="Share of teams holding the player">
          {lists.owned.map((p) => <Row key={p.id} p={p} right={`${p.owned}%`} />)}
        </Card>
      </div>
      <p style={{ color: "var(--muted)", fontSize: ".82rem" }}>
        SuperCoach scores come from Champion Data&apos;s player ratings. New to it? See{" "}
        <Link href="/supercoach/how-it-works" style={{ color: "var(--gold)" }}>How SuperCoach works</Link>.
      </p>
    </div>
  );
}

function Card({ title, href, note, children }: { title: string; href: string; note: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: ".7rem .8rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0, fontSize: ".82rem", textTransform: "uppercase", letterSpacing: ".03em", fontFamily: "var(--font-cond)" }}>{title}</h2>
        <Link href={href} style={{ color: "var(--gold)", fontSize: ".74rem" }}>All →</Link>
      </div>
      <p style={{ color: "var(--muted)", fontSize: ".7rem", margin: "2px 0 6px" }}>{note}</p>
      <div style={{ display: "grid", gap: 2 }}>{children}</div>
    </div>
  );
}

function Row({ p, right, tone }: { p: ScPlayer; right: string; tone?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".88rem" }}>
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        <b>{p.name}</b>
        <span style={{ color: "var(--muted)", marginLeft: 5, fontSize: ".74rem" }}>{p.teamAbbr}</span>
        {p.positions[0] && <span style={{ color: posColor(p.positions[0]), marginLeft: 4, fontSize: ".68rem", fontWeight: 800 }}>{p.positions[0]}</span>}
      </span>
      <span style={{ color: "var(--muted)", fontSize: ".74rem" }}>{moneyK(p.price)}</span>
      <span style={{ width: 52, textAlign: "right", fontWeight: 700, color: tone === undefined ? "var(--text)" : tone > 0 ? "var(--accent-2,#7bd88f)" : "var(--danger)" }}>{right}</span>
    </div>
  );
}
