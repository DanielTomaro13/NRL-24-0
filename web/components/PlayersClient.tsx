"use client";
import { useEffect, useState } from "react";
import PlayersBrowser from "@/components/PlayersBrowser";
import { loadGamesData, type ProfilePlayer } from "@/lib/games-data";
import { getComp, compLabel, type Comp } from "@/lib/comp";
import { slugify } from "@/lib/format";

/** Renders a top-150 NRL slice server-side (good SEO + small HTML), then loads
 *  the full set client-side for search — or the NRLW set when toggled. */
export default function PlayersClient({ initial }: { initial: ProfilePlayer[] }) {
  const [players, setPlayers] = useState<ProfilePlayer[]>(initial);
  const [comp, setC] = useState<Comp>("nrl");
  useEffect(() => {
    setC(getComp());
    loadGamesData().then((d) =>
      setPlayers([...d.players].sort((a, b) => b.fame - a.fame).map((p) => ({ ...p, slug: slugify(p.name) })))
    );
  }, []);
  return (
    <>
      <p style={{ color: "var(--muted)", marginTop: -6 }}>{players.length} {compLabel(comp)} players, rated from real match stats.</p>
      <PlayersBrowser players={players} comp={comp} />
    </>
  );
}
