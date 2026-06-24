import { pageMeta } from "@/lib/seo";
import { loadPredictions } from "@/lib/model.server";
import PredictionsClient from "@/components/model/PredictionsClient";

export const metadata = pageMeta({
  title: "NRL player projections — tries, points & kicker points",
  description:
    "Model projections for every player this round: anytime-try probability, expected tries, expected player points and kicker points, by match.",
  path: "/model/predictions",
  keywords: ["NRL player projections", "NRL anytime try", "NRL player points", "NRL tips"],
});

export default async function PredictionsPage() {
  const data = await loadPredictions();
  return <PredictionsClient matches={data.matches} />;
}
