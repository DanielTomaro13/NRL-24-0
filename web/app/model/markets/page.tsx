import { pageMeta } from "@/lib/seo";
import { loadTeamMarkets } from "@/lib/model.server";
import { MODEL_COMPS, type ModelComp, type TeamMarket } from "@/lib/modelcomp";
import MarketsClient from "@/components/model/MarketsClient";

export const metadata = pageMeta({
  title: "NRL & NRLW match markets — model head-to-head, line & total odds",
  description:
    "Model-fair head-to-head, line and total prices for every game this round, from the match-outcome model (Elo + form). NRLW and NRL.",
  path: "/model/markets",
  keywords: ["NRLW head to head", "NRLW line betting", "NRL match odds model", "NRLW total points"],
});

export default async function MarketsPage() {
  const entries = await Promise.all(
    MODEL_COMPS.map(async (c) => [c.id, (await loadTeamMarkets(c.id)).matches] as const)
  );
  const byComp = Object.fromEntries(entries) as Record<ModelComp, TeamMarket[]>;
  return <MarketsClient byComp={byComp} />;
}
