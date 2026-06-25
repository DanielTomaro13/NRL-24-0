import { pageMeta } from "@/lib/seo";
import { loadSuperCoach } from "@/lib/model.server";
import ScInjuries from "@/components/supercoach/ScInjuries";

export const metadata = pageMeta({
  title: "NRL SuperCoach injuries & news — availability",
  description: "NRL SuperCoach players carrying an availability flag (out, test, suspended) or recent news. Check before locking in your team.",
  path: "/supercoach/injuries",
  keywords: ["NRL SuperCoach injuries", "SuperCoach team news", "NRL late outs"],
});

export default async function ScInjuriesPage() {
  const sc = await loadSuperCoach();
  return <ScInjuries players={sc.players} />;
}
