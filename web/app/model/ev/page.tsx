import { pageMeta } from "@/lib/seo";
import { loadCompare } from "@/lib/model.server";
import EvClient from "@/components/model/EvClient";

export const metadata = pageMeta({
  title: "NRL value bets — model +EV board",
  description:
    "Every NRL player market where the model rates the best available price as value, ranked by expected value, with the book offering it and a suggested Kelly stake.",
  path: "/model/ev",
  keywords: ["NRL value bets", "NRL +EV", "NRL expected value", "NRL betting model edges"],
});

export default async function EvPage() {
  const data = await loadCompare();
  return <EvClient data={data} />;
}
