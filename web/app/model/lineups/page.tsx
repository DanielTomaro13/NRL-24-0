import { pageMeta } from "@/lib/seo";
import { loadLineups, loadModelMeta } from "@/lib/model.server";
import { MODEL_COMPS, type ModelComp } from "@/lib/modelcomp";
import type { LineupMatch, ModelMeta } from "@/lib/model";
import LineupsComp from "@/components/model/LineupsComp";

export const metadata = pageMeta({
  title: "NRL team lists — confirmed lineups this round",
  description:
    "Confirmed NRL team lists for every game this round: the named 1–17 plus bench and reserves by position, with each side's goal kicker flagged.",
  path: "/model/lineups",
  keywords: ["NRL team lists", "NRL lineups", "NRL teams this week", "NRL goal kicker"],
});

export default async function LineupsPage() {
  const [lineupEntries, metaEntries] = await Promise.all([
    Promise.all(MODEL_COMPS.map(async (c) => [c.id, (await loadLineups(c.id)).matches] as const)),
    Promise.all(MODEL_COMPS.map(async (c) => [c.id, await loadModelMeta(c.id)] as const)),
  ]);
  const byComp = Object.fromEntries(lineupEntries) as Partial<Record<ModelComp, LineupMatch[]>>;
  const metas = Object.fromEntries(metaEntries) as Partial<Record<ModelComp, ModelMeta>>;
  return <LineupsComp byComp={byComp} metas={metas} />;
}
