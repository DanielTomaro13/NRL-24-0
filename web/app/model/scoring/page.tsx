import { pageMeta } from "@/lib/seo";
import { loadScoring } from "@/lib/model.server";
import ScoringClient from "@/components/model/ScoringClient";

export const metadata = pageMeta({
  title: "NRL scoring model — player points & try-scorer value",
  description:
    "Player-points and try-scorer leaders from the model, with the model's fair price next to the best available bookmaker price and the resulting edge.",
  path: "/model/scoring",
  keywords: ["NRL player points", "NRL try scorer odds", "NRL scoring model", "NRL value"],
});

export default async function ScoringPage() {
  const data = await loadScoring();
  return <ScoringClient data={data} />;
}
