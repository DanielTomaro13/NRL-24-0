import { pageMeta } from "@/lib/seo";
import { loadPredictions, loadSuperCoach } from "@/lib/model.server";
import { playerKey } from "@/lib/supercoach";
import PredictionsClient from "@/components/model/PredictionsClient";

export const metadata = pageMeta({
  title: "NRL player projections — tries, points & kicker points",
  description:
    "Model projections for every player this round: anytime-try probability, expected tries, expected player points and kicker points, by match.",
  path: "/model/predictions",
  keywords: ["NRL player projections", "NRL anytime try", "NRL player points", "NRL tips"],
});

export default async function PredictionsPage() {
  const [data, sc] = await Promise.all([loadPredictions(), loadSuperCoach()]);
  const scByKey: Record<string, number> = {};
  for (const p of sc.players) { const k = playerKey(p.name); if (!(k in scByKey)) scByKey[k] = p.proj; }
  return <PredictionsClient matches={data.matches} scByKey={scByKey} />;
}
