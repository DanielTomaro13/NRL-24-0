"use client";
import { useModelComp } from "@/components/model/modelcomp.client";
import { MODEL_COMPS } from "@/lib/modelcomp";

/** Shared "nothing here for this competition yet" notice for comp-aware pages. */
export default function EmptyComp({ what }: { what: string }) {
  const comp = useModelComp();
  const label = MODEL_COMPS.find((c) => c.id === comp)?.label ?? comp;
  return (
    <div className="panel" style={{ padding: 16, color: "var(--muted)", maxWidth: "60ch" }}>
      No {what} for <b style={{ color: "var(--text)" }}>{label}</b> right now — this usually means the
      round hasn&apos;t been scheduled yet or team lists aren&apos;t out. Check back closer to game day.
    </div>
  );
}
