import { pageMeta } from "@/lib/seo";
import { loadScoring } from "@/lib/model.server";
import { MODEL_COMPS, type ModelComp } from "@/lib/modelcomp";
import type { ScoringData } from "@/lib/model";
import ScoringComp from "@/components/model/ScoringComp";

export const metadata = pageMeta({
  title: "NRL & NRLW scoring model — player points & try-scorer value",
  description:
    "Player-points and try-scorer leaders from the model across NRL, NRLW and State of Origin, with the model's fair price next to the best available bookmaker price.",
  path: "/model/scoring",
  keywords: ["NRL player points", "NRLW try scorer", "NRL scoring model", "NRL value"],
});

export default async function ScoringPage() {
  const entries = await Promise.all(
    MODEL_COMPS.map(async (c) => [c.id, await loadScoring(c.id)] as const)
  );
  const byComp = Object.fromEntries(entries) as Partial<Record<ModelComp, ScoringData>>;
  return <ScoringComp byComp={byComp} />;
}
