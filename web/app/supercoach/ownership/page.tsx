import { pageMeta } from "@/lib/seo";
import { loadSuperCoach } from "@/lib/model.server";
import ScBoard from "@/components/supercoach/ScBoard";

export const metadata = pageMeta({
  title: "NRL SuperCoach ownership — most owned & differentials",
  description: "How widely each NRL SuperCoach player is held, plus differentials: low-owned players projected to score well.",
  path: "/supercoach/ownership",
  keywords: ["NRL SuperCoach ownership", "SuperCoach differentials", "most owned SuperCoach"],
});

export default async function ScOwnership() {
  const sc = await loadSuperCoach();
  return (
    <ScBoard players={sc.players} initialSort="own" max={300}
      tabs={[{ key: "all", label: "Most owned" }, { key: "diff", label: "Differentials" }]}
      columns={["name", "own", "proj", "avg", "value", "price"]} />
  );
}
