import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/seo";
import { allMatchIds, matchById } from "@/lib/matchdb";
import MatchDetail from "@/components/MatchDetail";

export function generateStaticParams() {
  return allMatchIds("nrl").map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const box = matchById("nrl", id);
  if (!box) return pageMeta({ title: "Match not found", path: `/matches/${id}` });
  return pageMeta({
    title: `${box.home} ${box.hs}–${box.as} ${box.away} — ${box.season} Round ${box.round}`,
    description: `Full box score and player stats: ${box.home} v ${box.away}, NRL ${box.season} Round ${box.round}${box.venue ? ` at ${box.venue}` : ""}.`,
    path: `/matches/${id}`,
    keywords: [`${box.home} v ${box.away}`, `${box.home} box score`, "NRL match stats", `NRL ${box.season}`],
  });
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const box = matchById("nrl", id);
  if (!box) notFound();
  return <MatchDetail box={box} comp="nrl" />;
}
