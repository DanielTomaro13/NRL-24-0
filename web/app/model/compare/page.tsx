import { pageMeta } from "@/lib/seo";
import { loadCompare } from "@/lib/model.server";
import CompareClient from "@/components/model/CompareClient";
import { NrlOnlyGate } from "@/components/model/modelcomp.client";

export const metadata = pageMeta({
  title: "NRL odds comparison — model fair price vs the bookies",
  description:
    "Every NRL player market we can price, with the model's fair odds next to live Sportsbet, Ladbrokes, TAB, PointsBet and Dabble prices. Best price highlighted; positive EV flagged.",
  path: "/model/compare",
  keywords: ["NRL odds comparison", "NRL best odds", "NRL value bets", "NRL player props"],
});

export default async function ComparePage() {
  const data = await loadCompare();
  return <NrlOnlyGate><CompareClient data={data} /></NrlOnlyGate>;
}
