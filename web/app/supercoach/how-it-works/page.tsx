import Link from "next/link";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "How NRL SuperCoach works — scoring, prices & projections",
  description: "A plain-English guide to NRL SuperCoach: how points are scored, how prices and breakevens move, and what every metric on our SuperCoach pages means.",
  path: "/supercoach/how-it-works",
  keywords: ["how NRL SuperCoach works", "SuperCoach scoring", "SuperCoach breakeven", "SuperCoach prices"],
});

export default function HowScWorks() {
  return (
    <div style={{ display: "grid", gap: 20, maxWidth: "70ch", lineHeight: 1.6, color: "var(--text)" }}>
      <Section title="What SuperCoach is">
        <p>SuperCoach is a salary-cap fantasy game. You get a budget and pick a squad; each player has a <b>price</b>
          and earns <b>SuperCoach points</b> each round on how they actually played. As players rise and fall in price
          you trade to bank cash and upgrade. Three things drive everything: how a player <b>scores</b>, how their
          <b> price</b> moves, and how many points they&apos;re <b>projected</b> to score next.</p>
      </Section>

      <Section title="How points are scored">
        <p>NRL SuperCoach scores come from <b>Champion Data&apos;s base statistics</b> — every meaningful action on the
          field carries a points value, added up live. Unlike a simple try-and-goal tally, it rewards the full
          contribution of forwards and playmakers, not just scorers.</p>
        <p>You&apos;re <b style={{ color: "var(--accent-2,#7bd88f)" }}>rewarded</b> for:</p>
        <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--muted)" }}>
          <li>Tries, try assists, line breaks and line-break assists</li>
          <li>Tackles, tackle breaks, offloads and forced drop-outs</li>
          <li>Run metres, kicks/goals and other attacking involvements</li>
        </ul>
        <p>and <b style={{ color: "var(--danger)" }}>penalised</b> for:</p>
        <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--muted)" }}>
          <li>Errors (handling/ball control) and missed tackles</li>
          <li>Penalties conceded and being sin-binned / sent off</li>
        </ul>
        <p className="card" style={{ padding: ".7rem .9rem", color: "var(--muted)" }}>
          A score near <b style={{ color: "var(--text)" }}>50</b> is solid; gun forwards and halves push 70–100+.
          The system is <b>deterministic</b> — the same stat line always gives the same score. It&apos;s clean enough
          that we can reconstruct it from the box score <b style={{ color: "var(--accent-2,#7bd88f)" }}>exactly</b>
          (R² = 1.00), so the values are fully transparent.
        </p>
      </Section>

      <Section title="How prices move">
        <p>A player&apos;s price tracks recent scoring — SuperCoach divides points by a “magic number” and updates off a
          <b> rolling average of the last few games</b>, so price chases form. The key trading idea is the
          <b> breakeven</b>: the score a player must post to hold their price. Beat it and they rise; miss it and they
          fall. Cheap players who keep beating their breakeven are <b>cash cows</b> — buy low, let them make cash, sell
          before they plateau. Our <Link href="/supercoach/prices" style={{ color: "var(--gold)" }}>Prices</Link> page
          tracks round and season price change and flags the cash cows.</p>
      </Section>

      <Section title="Positions">
        <p>Players are classified by position — <b>FLB</b> (fullback), <b>CTW</b> (centre/wing), <b>5/8</b>, <b>HFB</b>
          (halfback), <b>HOK</b> (hooker), <b>FRF</b> (front row) and <b>2RF</b> (second row). Some hold two, giving
          handy trade flexibility. We show every player&apos;s position(s) throughout.</p>
      </Section>

      <Section title="What the metrics mean">
        <Defs items={[
          ["Price", "Current SuperCoach salary. Rd $ / Szn $ are the change this round and across the season."],
          ["Proj", "SuperCoach's own projected score for the upcoming round."],
          ["Avg / L3 / L5", "Season average, and the average of the last 3 and last 5 games."],
          ["Form", "L3 average minus season average — positive means heating up."],
          ["Consist", "100 × (1 − SD ÷ mean) over games played; higher = fewer cheap weeks."],
          ["Own%", "Share of teams holding the player. Differentials are low-owned, high-projection players."],
          ["Value", "Projected points per $100k of price — best bang for your salary."],
          ["v Opp / @ Ven", "The player's historical average against this round's opponent and at the venue."],
        ]} />
      </Section>

      <Section title="Where the data comes from">
        <p>All figures are pulled live from SuperCoach&apos;s public feed and refreshed through the week (prices settle
          after each round). We add the derived metrics — value, form, consistency and the sparklines. This is an
          independent stats resource and isn&apos;t affiliated with or endorsed by SuperCoach or the NRL.</p>
        <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>
          Explore: <Link href="/supercoach/players" style={{ color: "var(--gold)" }}>players</Link> ·{" "}
          <Link href="/supercoach/value" style={{ color: "var(--gold)" }}>value</Link> ·{" "}
          <Link href="/supercoach/model" style={{ color: "var(--gold)" }}>model vs SC</Link>.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: "grid", gap: 8 }}>
      <h2 style={{ margin: 0, fontSize: "1.15rem", fontFamily: "var(--font-cond)", color: "var(--gold)" }}>{title}</h2>
      {children}
    </section>
  );
}
function Defs({ items }: { items: [string, string][] }) {
  return (
    <dl className="card" style={{ display: "grid", gap: 0, padding: 0, margin: 0 }}>
      {items.map(([t, d], i) => (
        <div key={t} style={{ display: "flex", gap: 12, padding: ".5rem .8rem", borderTop: i ? "1px solid var(--border)" : "none" }}>
          <dt style={{ width: 96, flexShrink: 0, fontWeight: 800 }}>{t}</dt>
          <dd style={{ margin: 0, color: "var(--muted)" }}>{d}</dd>
        </div>
      ))}
    </dl>
  );
}
