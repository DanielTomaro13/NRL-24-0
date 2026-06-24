"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/model", label: "Overview" },
  { href: "/model/lineups", label: "Lineups" },
  { href: "/model/predictions", label: "Predictions" },
  { href: "/model/compare", label: "Compare odds" },
  { href: "/model/ev", label: "Value bets" },
  { href: "/model/pickem", label: "Pick'em" },
  { href: "/model/scoring", label: "Scoring" },
  { href: "/model/accuracy", label: "Accuracy" },
];

export default function ModelNav() {
  const path = usePathname()?.replace(/\/$/, "") || "/model";
  return (
    <nav style={{ display: "flex", gap: 6, flexWrap: "wrap" }} aria-label="Model sections">
      {TABS.map((t) => {
        const on = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className="chip"
            style={{
              textDecoration: "none",
              background: on ? "var(--accent)" : "var(--panel)",
              color: on ? "#1a0a06" : "var(--muted)",
              borderColor: on ? "var(--accent)" : "var(--border)",
              fontWeight: on ? 800 : 600,
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
