import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/seo";
import { allMatchIds, matchById } from "@/lib/matchdb";
import MatchDetail from "@/components/MatchDetail";

export function generateStaticParams() {
  return allMatchIds("nrlw").map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const box = matchById("nrlw", id);
  if (!box) return pageMeta({ title: "Match not found", path: `/w/matches/${id}` });
  return pageMeta({
    title: `${box.home} ${box.hs}–${box.as} ${box.away} — NRLW ${box.season} Round ${box.round}`,
    description: `Full box score and player stats: ${box.home} v ${box.away}, NRLW ${box.season} Round ${box.round}${box.venue ? ` at ${box.venue}` : ""}.`,
    path: `/w/matches/${id}`,
    keywords: [`${box.home} v ${box.away}`, "NRLW match stats", `NRLW ${box.season}`],
  });
}

export default async function WMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const box = matchById("nrlw", id);
  if (!box) notFound();
  return <MatchDetail box={box} comp="nrlw" />;
}
