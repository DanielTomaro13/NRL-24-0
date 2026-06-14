import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/seo";
import { allPlayers, playerById } from "@/lib/playerdb";
import PlayerProfile from "@/components/PlayerProfile";

export const dynamicParams = false;

export function generateStaticParams() {
  // every player shown in the browser needs a page (static export → no fallback)
  return allPlayers("nrl").map((p) => ({ id: String(p.id), slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  const p = playerById("nrl", id);
  if (!p) return {};
  return pageMeta({
    title: `${p.name} — NRL profile, stats & rating`,
    description: `${p.name}: ${p.posName} for ${p.club}. ${p.apps} NRL games, ${p.tries} tries, ${p.firstYear}–${p.lastYear}. All-time NRL 24-0 rating ${p.rating}.`,
    path: `/players/${p.id}/${p.slug}`,
    keywords: [p.name, "NRL", p.club, p.posName, "stats", "rating"],
  });
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  const p = playerById("nrl", id);
  if (!p) notFound();
  return <PlayerProfile p={p} comp="nrl" />;
}
