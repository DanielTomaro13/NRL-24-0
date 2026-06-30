import { pageMeta } from "@/lib/seo";
import { loadPickem } from "@/lib/model.server";
import PickemClient from "@/components/model/PickemClient";
import { NrlOnlyGate } from "@/components/model/modelcomp.client";

export const metadata = pageMeta({
  title: "NRL Pick'em model — judge any line, build a parlay",
  description:
    "Type the Dabble Pick'em line for any player and the model returns the probability of going over, fair odds and a lean. Add legs to build a parlay and see its combined edge.",
  path: "/model/pickem",
  keywords: ["NRL Pick'em", "Dabble Pick'em", "NRL player props model", "NRL parlay"],
});

export default async function PickemPage() {
  const data = await loadPickem();
  return <NrlOnlyGate><PickemClient data={data} /></NrlOnlyGate>;
}
