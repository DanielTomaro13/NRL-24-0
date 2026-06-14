"use client";
import { useEffect, useState } from "react";
import PlayersBrowser from "@/components/PlayersBrowser";
import { loadGamesData, type ProfilePlayer } from "@/lib/games-data";
import { getComp, compLabel, type Comp } from "@/lib/comp";
import { slugify } from "@/lib/format";

/** Renders the NRL list server-side (good SEO, the default), and swaps to NRLW
 *  client-side only when the competition toggle is set to NRLW. */
export default function PlayersClient({ initial }: { initial: ProfilePlayer[] }) {
  const [players, setPlayers] = useState<ProfilePlayer[]>(initial);
  const [comp, setC] = useState<Comp>("nrl");
  useEffect(() => {
    const c = getComp(); setC(c);
    if (c === "nrlw") {
      loadGamesData().then((d) =>
        setPlayers([...d.players].sort((a, b) => b.fame - a.fame).map((p) => ({ ...p, slug: slugify(p.name) })))
      );
    }
  }, []);
  return (
    <>
      <p style={{ color: "var(--muted)", marginTop: -6 }}>{players.length} {compLabel(comp)} players, rated from real match stats.</p>
      <PlayersBrowser players={players} comp={comp} />
    </>
  );
}
