import { pageMeta } from "@/lib/seo";
import { loadSuperCoach } from "@/lib/model.server";
import ScBoard from "@/components/supercoach/ScBoard";

export const metadata = pageMeta({
  title: "NRL SuperCoach value — best points per dollar",
  description: "NRL SuperCoach players ranked by projected points per $100k of price — the best value for your salary cap.",
  path: "/supercoach/value",
  keywords: ["SuperCoach value", "NRL SuperCoach points per dollar", "SuperCoach bargains"],
});

export default async function ScValue() {
  const sc = await loadSuperCoach();
  return (
    <>
      <ScBoard players={sc.players} initialSort="value" defaultPreset="playing" search max={300}
        columns={["name", "value", "proj", "avg", "price", "own"]} />
      <p style={{ color: "var(--muted)", fontSize: ".8rem", marginTop: 8 }}>
        Value = projected points ÷ (price ÷ $100k). Filtered to players with 3+ games.
      </p>
    </>
  );
}
