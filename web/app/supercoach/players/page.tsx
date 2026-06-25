import { pageMeta } from "@/lib/seo";
import { loadSuperCoach } from "@/lib/model.server";
import ScBoard from "@/components/supercoach/ScBoard";

export const metadata = pageMeta({
  title: "NRL SuperCoach players — price, projection, averages & form",
  description: "Every NRL SuperCoach player: price, projected score, season and recent averages, ownership and consistency. Sortable and searchable.",
  path: "/supercoach/players",
  keywords: ["NRL SuperCoach", "SuperCoach prices", "SuperCoach projections", "SuperCoach players"],
});

export default async function ScPlayers() {
  const sc = await loadSuperCoach();
  return (
    <ScBoard players={sc.players} search posFilter max={900}
      initialSort="proj"
      columns={["name", "price", "pc", "proj", "avg", "avg3", "own", "gp", "std", "spark"]} />
  );
}
