import { pageMeta } from "@/lib/seo";
import { loadSuperCoach, loadPredictions } from "@/lib/model.server";
import ScModel from "@/components/supercoach/ScModel";

export const metadata = pageMeta({
  title: "Model vs SuperCoach — NRL projection comparison",
  description: "Our NRL model's projection mapped onto the SuperCoach scale and compared to SuperCoach's own projection, ranked by edge.",
  path: "/supercoach/model",
  keywords: ["NRL model vs SuperCoach", "SuperCoach projection comparison", "NRL SuperCoach edge"],
});

export default async function ScModelPage() {
  const [sc, pred] = await Promise.all([loadSuperCoach(), loadPredictions()]);
  return <ScModel matches={pred.matches} players={sc.players} />;
}
