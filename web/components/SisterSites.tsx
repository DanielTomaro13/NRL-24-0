/**
 * Cross-site strip linking the three sister projects (the "0 Series"). The same
 * bar lives at the top of AFL 23-0 and Football Invincibles so all three sites
 * point at one another.
 */
const SITES = [
  { key: "afl", label: "AFL 23-0", href: "https://afl23-0.com" },
  { key: "nrl", label: "NRL 24-0", href: "https://nrl24-0.com" },
  { key: "football", label: "Football Invincibles", href: "https://footballinvincibles.com" },
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
