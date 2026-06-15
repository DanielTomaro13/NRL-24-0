import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/seo";
import { allClubs, clubBySlug, clubSlug, teamSummary } from "@/lib/teamdb";
import TeamProfile from "@/components/TeamProfile";

export function generateStaticParams() {
  return allClubs("nrl").map((club) => ({ slug: clubSlug(club) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = clubBySlug("nrl", slug);
  if (!club) return pageMeta({ title: "Club not found", path: `/teams/${slug}` });
  return pageMeta({
    title: `${club} — NRL record, ladder finishes & top players`,
    description: `${club} in NRL 24-0: season-by-season ladder finishes, all-time win-loss record and the club's highest-rated players, from real match data.`,
    path: `/teams/${slug}`,
    keywords: [`${club}`, `${club} stats`, `${club} players`, `${club} record`],
  });
}

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = clubBySlug("nrl", slug);
  if (!club) notFound();
  return <TeamProfile team={teamSummary("nrl", club)} comp="nrl" />;
}
