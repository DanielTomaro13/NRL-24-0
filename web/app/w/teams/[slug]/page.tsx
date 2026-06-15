import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/seo";
import { allClubs, clubBySlug, clubSlug, teamSummary } from "@/lib/teamdb";
import TeamProfile from "@/components/TeamProfile";

export function generateStaticParams() {
  return allClubs("nrlw").map((club) => ({ slug: clubSlug(club) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = clubBySlug("nrlw", slug);
  if (!club) return pageMeta({ title: "Club not found", path: `/w/teams/${slug}` });
  return pageMeta({
    title: `${club} — NRLW record, ladder finishes & top players`,
    description: `${club} in NRL 24-0: season-by-season NRLW ladder finishes, all-time record and the club's highest-rated players, from real match data.`,
    path: `/w/teams/${slug}`,
    keywords: [`${club}`, `${club} NRLW`, `${club} players`, `${club} record`],
  });
}

export default async function WTeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = clubBySlug("nrlw", slug);
  if (!club) notFound();
  return <TeamProfile team={teamSummary("nrlw", club)} comp="nrlw" />;
}
