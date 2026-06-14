"use client";
import { useEffect, useState } from "react";
import StatsBoards from "@/components/StatsBoards";
import { loadGamesData, type ProfilePlayer } from "@/lib/games-data";
import { getComp, type Comp } from "@/lib/comp";
import { slugify } from "@/lib/format";

/** NRL leaders render server-side (SEO); swaps to NRLW client-side on toggle. */
export default function StatsClient({ initial }: { initial: ProfilePlayer[] }) {
  const [players, setPlayers] = useState<ProfilePlayer[]>(initial);
  const [comp, setC] = useState<Comp>("nrl");
  useEffect(() => {
    const c = getComp(); setC(c);
    if (c === "nrlw") {
      loadGamesData().then((d) => setPlayers(d.players.map((p) => ({ ...p, slug: slugify(p.name) }))));
    }
  }, []);
  return <StatsBoards players={players} comp={comp} />;
}
