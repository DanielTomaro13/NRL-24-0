import { pageMeta } from "@/lib/seo";
import { loadSuperCoach } from "@/lib/model.server";
import ScBoard from "@/components/supercoach/ScBoard";

export const metadata = pageMeta({
  title: "NRL SuperCoach form — who's heating up",
  description: "NRL SuperCoach form guide: last-3 average vs season average, consistency, and round-by-round scores.",
  path: "/supercoach/form",
  keywords: ["NRL SuperCoach form", "SuperCoach consistency", "SuperCoach hot players"],
});

export default async function ScForm() {
  const sc = await loadSuperCoach();
  return (
    <>
      <ScBoard players={sc.players} initialSort="form" defaultPreset="playing" search max={300}
        columns={["name", "form", "avg3", "avg5", "avg", "consist", "spark"]} />
      <p style={{ color: "var(--muted)", fontSize: ".8rem", marginTop: 8 }}>
        Form = last-3 average − season average (positive = trending up). Consistency = 100 × (1 − SD ÷ mean) over games played.
      </p>
    </>
  );
}
