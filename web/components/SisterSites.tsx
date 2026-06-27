/**
 * Cross-site strip linking the three sister projects (the "0 Series"). The same
 * bar lives at the top of AFL 23-0 and Football Invincibles so all three sites
 * point at one another.
 */
const SITES = [
  { key: "afl", label: "AFL 23-0", href: "https://afl23-0.com" },
  { key: "nrl", label: "NRL 24-0", href: "https://nrl24-0.com" },
  { key: "football", label: "Football Invincibles", href: "https://footballinvincibles.com" },
  { key: "mlb", label: "MLB 162-0", href: "https://mlb162-0.com" },
  { key: "nba", label: "NBA 82-0", href: "https://nba82-0.com" },
  { key: "nbl", label: "NBL 33-0", href: "https://nbl33-0.com" },
  { key: "f1", label: "F1 Slam", href: "https://f1slam.com" },
  { key: "tennis", label: "Tennis Slam", href: "https://grandtennisslam.com" },
];

export default function SisterSites({ active }: { active: "afl" | "nrl" | "football" }) {
  return (
    <div className="sister-bar" role="navigation" aria-label="Sister sites">
      <span style={{ color: "var(--muted)", marginRight: 2, fontWeight: 700, fontSize: ".7rem" }}>
        THE 0 SERIES ·
      </span>
      {SITES.map((s) =>
        s.key === active ? (
          <span key={s.key} className="sister-link" data-active="true" aria-current="page">{s.label}</span>
        ) : (
          <a key={s.key} className="sister-link" href={s.href}>{s.label}</a>
        )
      )}
    </div>
  );
}
