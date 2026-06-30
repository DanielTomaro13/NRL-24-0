import { pageMeta } from "@/lib/seo";
import { loadBacktest } from "@/lib/model.server";
import { MODEL_COMPS, type ModelComp } from "@/lib/modelcomp";
import type { BacktestData } from "@/lib/model";
import AccuracyComp from "@/components/model/AccuracyComp";

export const metadata = pageMeta({
  title: "NRL & NRLW model accuracy — out-of-sample backtest",
  description:
    "How the model actually performs across NRL and NRLW: out-of-sample try-scorer AUC, calibration and a reliability curve, plus per-stat error versus a recent-form baseline.",
  path: "/model/accuracy",
  keywords: ["NRL model accuracy", "NRLW backtest", "NRL model calibration", "NRL prediction accuracy"],
});

export default async function AccuracyPage() {
  const entries = await Promise.all(
    MODEL_COMPS.map(async (c) => [c.id, await loadBacktest(c.id)] as const)
  );
  const byComp = Object.fromEntries(entries) as Partial<Record<ModelComp, BacktestData>>;
  return <AccuracyComp byComp={byComp} />;
}
