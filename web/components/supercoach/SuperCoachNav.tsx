"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/supercoach", label: "Overview" },
  { href: "/supercoach/players", label: "Players" },
  { href: "/supercoach/prices", label: "Prices" },
  { href: "/supercoach/value", label: "Value" },
  { href: "/supercoach/form", label: "Form" },
  { href: "/supercoach/ownership", label: "Ownership" },
  { href: "/supercoach/injuries", label: "Injuries" },
  { href: "/supercoach/fixtures", label: "Fixtures" },
  { href: "/supercoach/model", label: "Model vs SC" },
  { href: "/supercoach/how-it-works", label: "How it works" },
];

export default function SuperCoachNav() {
  const path = usePathname()?.replace(/\/$/, "") || "/supercoach";
  return (
    <nav style={{ display: "flex", gap: 6, flexWrap: "wrap" }} aria-label="SuperCoach sections">
      {TABS.map((t) => {
        const on = path === t.href;
        return (
          <Link key={t.href} href={t.href} className="chip" style={{
            textDecoration: "none",
            background: on ? "var(--gold)" : "var(--panel)",
            color: on ? "#1a0a06" : "var(--muted)",
            borderColor: on ? "var(--gold)" : "var(--border)",
            fontWeight: on ? 800 : 600,
          }}>{t.label}</Link>
        );
      })}
    </nav>
  );
}
