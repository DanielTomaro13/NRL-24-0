"use client";
import { useModelComp } from "@/components/model/modelcomp.client";
import PredictionsClient from "@/components/model/PredictionsClient";
import EmptyComp from "@/components/model/EmptyComp";
import type { PredMatch } from "@/lib/model";
import type { ModelComp } from "@/lib/modelcomp";

export default function PredictionsComp({
  byComp,
  scByKey,
}: {
  byComp: Partial<Record<ModelComp, PredMatch[]>>;
  scByKey: Record<string, number>;
}) {
  const comp = useModelComp();
  const matches = byComp[comp] ?? [];
  if (!matches.length) return <EmptyComp what="player projections" />;
  // SuperCoach projections only exist for men's NRL
  return <PredictionsClient matches={matches} scByKey={comp === "nrl" ? scByKey : {}} />;
}
