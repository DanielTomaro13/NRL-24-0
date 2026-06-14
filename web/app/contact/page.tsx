import Link from "next/link";
import { pageMeta, SITE } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Contact",
  description: "Get in touch with the team behind NRL 24-0 — feedback, data corrections, bug reports and advertising enquiries.",
  path: "/contact",
  keywords: ["NRL 24-0 contact"],
});

const EMAIL = "danieltomaro3@gmail.com";

export default function ContactPage() {
  return (
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: 680 }}>
      <header>
        <h1 style={{ fontSize: "2.2rem", margin: 0, textTransform: "uppercase" }}>Contact</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>
          {SITE.name} is built and maintained by Daniel Tomaro. I read every message.
        </p>
      </header>

      <section className="card" style={{ padding: "1.5rem", display: "grid", gap: 12 }}>
        <div>
          <div style={{ fontSize: ".72rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>Email</div>
          <a href={`mailto:${EMAIL}`} style={{ fontFamily: "var(--font-cond)", fontSize: "1.6rem", color: "var(--accent)" }}>{EMAIL}</a>
        </div>
        <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
          Use this address for feedback and feature ideas, player or stat corrections, bug reports, or
          advertising and partnership enquiries.
        </p>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h2 style={{ fontSize: "1.15rem", margin: 0 }}>Good to know</h2>
        <ul style={{ color: "var(--muted)", lineHeight: 1.65, margin: 0, paddingLeft: "1.1rem", display: "grid", gap: 6, fontSize: ".92rem" }}>
          <li>Ratings come from real Champion Data match feeds — see the <Link href="/about" style={{ color: "var(--accent)" }}>About page</Link> for how the numbers are built.</li>
          <li>How we handle data is set out in the <Link href="/privacy" style={{ color: "var(--accent)" }}>Privacy Policy</Link>.</li>
          <li>{SITE.name} is unofficial and not affiliated with the NRL, NRLW or any club.</li>
        </ul>
      </section>
    </div>
  );
}
