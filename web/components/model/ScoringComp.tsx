"use client";
import { useModelComp } from "@/components/model/modelcomp.client";
import ScoringClient from "@/components/model/ScoringClient";
import EmptyComp from "@/components/model/EmptyComp";
import type { ScoringData } from "@/lib/model";
import type { ModelComp } from "@/lib/modelcomp";

export default function ScoringComp({ byComp }: { byComp: Partial<Record<ModelComp, ScoringData>> }) {
  const comp = useModelComp();
  const data = byComp[comp] ?? { points: [], tries: [] };
  if (!data.points.length && !data.tries.length) return <EmptyComp what="scoring leaders" />;
  return <ScoringClient data={data} />;
}
