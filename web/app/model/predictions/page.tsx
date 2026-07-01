import { pageMeta } from "@/lib/seo";
import { loadPredictions, loadSuperCoach } from "@/lib/model.server";
import { playerKey } from "@/lib/supercoach";
import { MODEL_COMPS, type ModelComp } from "@/lib/modelcomp";
import type { PredMatch } from "@/lib/model";
import PredictionsComp from "@/components/model/PredictionsComp";

export const metadata = pageMeta({
  title: "NRL & NRLW player projections — tries, points & kicker points",
  description:
    "Model projections for every player this round across NRL, NRLW and State of Origin: anytime-try probability, expected tries, player points and kicker points, by match.",
  path: "/model/predictions",
  keywords: ["NRL player projections", "NRLW projections", "NRL anytime try", "NRL player points", "NRL tips"],
});

export default async function PredictionsPage() {
  const [entries, sc] = await Promise.all([
    Promise.all(
      MODEL_COMPS.map(async (c) => [c.id, (await loadPredictions(c.id)).matches] as const)
    ),
    loadSuperCoach(),
  ]);
  const byComp = Object.fromEntries(entries) as Partial<Record<ModelComp, PredMatch[]>>;
  const scByKey: Record<string, number> = {};
  for (const p of sc.players) { const k = playerKey(p.name); if (!(k in scByKey)) scByKey[k] = p.proj; }
  return <PredictionsComp byComp={byComp} scByKey={scByKey} />;
}
