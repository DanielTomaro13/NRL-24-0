import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/seo";
import { allPlayers, playerById } from "@/lib/playerdb";
import PlayerProfile from "@/components/PlayerProfile";

export const dynamicParams = false;

export function generateStaticParams() {
  return allPlayers("nrlw").map((p) => ({ id: String(p.id), slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  const p = playerById("nrlw", id);
  if (!p) return {};
  return pageMeta({
    title: `${p.name} — NRLW profile, stats & rating`,
    description: `${p.name}: ${p.posName} for ${p.club}. ${p.apps} NRLW games, ${p.tries} tries, ${p.firstYear}–${p.lastYear}. All-time NRLW 24-0 rating ${p.rating}.`,
    path: `/w/players/${p.id}/${p.slug}`,
    keywords: [p.name, "NRLW", p.club, p.posName, "stats", "rating"],
  });
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  const p = playerById("nrlw", id);
  if (!p) notFound();
  return <PlayerProfile p={p} comp="nrlw" />;
}
