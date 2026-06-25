import { pageMeta } from "@/lib/seo";
import { loadSuperCoach } from "@/lib/model.server";
import ScBoard from "@/components/supercoach/ScBoard";

export const metadata = pageMeta({
  title: "NRL SuperCoach price changes — risers, fallers & cash cows",
  description: "This round's NRL SuperCoach price movers: biggest risers and fallers, season-long change, and the cash cows generating cash.",
  path: "/supercoach/prices",
  keywords: ["SuperCoach price changes", "SuperCoach cash cows", "NRL SuperCoach risers"],
});

export default async function ScPrices() {
  const sc = await loadSuperCoach();
  return (
    <>
      <ScBoard players={sc.players} initialSort="pc" max={300}
        tabs={[{ key: "all", label: "All" }, { key: "risers", label: "Risers" }, { key: "fallers", label: "Fallers" }, { key: "cows", label: "Cash cows" }]}
        columns={["name", "price", "pc", "tpc", "avg", "proj", "own"]} />
      <p style={{ color: "var(--muted)", fontSize: ".8rem", marginTop: 8 }}>
        Prices move on a rolling average of recent scores. Cash cows = cheap players (≤ $250k) who&apos;ve played —
        the rookies generating cash; sell once their price plateaus.
      </p>
    </>
  );
}
