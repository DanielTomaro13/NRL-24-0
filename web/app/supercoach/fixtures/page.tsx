import { pageMeta } from "@/lib/seo";
import { loadSuperCoach } from "@/lib/model.server";
import ScBoard from "@/components/supercoach/ScBoard";

export const metadata = pageMeta({
  title: "NRL SuperCoach fixtures — matchup difficulty",
  description: "How each NRL SuperCoach player has averaged against this round's opponent and at the venue, plus their next three fixtures.",
  path: "/supercoach/fixtures",
  keywords: ["NRL SuperCoach fixtures", "SuperCoach matchups", "SuperCoach draw"],
});

export default async function ScFixtures() {
  const sc = await loadSuperCoach();
  return (
    <>
      <ScBoard players={sc.players} initialSort="oppavg" defaultPreset="playing" search max={400}
        columns={["name", "opp", "oppavg", "venavg", "avg", "next"]} />
      <p style={{ color: "var(--muted)", fontSize: ".8rem", marginTop: 8 }}>
        “v Opp” / “@ Ven” are the player&apos;s historical SuperCoach average in those splits — green beats their season average.
      </p>
    </>
  );
}
