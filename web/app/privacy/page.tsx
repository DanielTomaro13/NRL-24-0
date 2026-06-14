import Link from "next/link";
import { pageMeta, SITE } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Privacy Policy",
  description: "How NRL 24-0 handles data: local game progress, privacy-friendly analytics, and third-party advertising (Google AdSense) cookies — and how to opt out.",
  path: "/privacy",
  keywords: ["NRL 24-0 privacy policy", "privacy"],
});

const UPDATED = "15 June 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: "grid", gap: 8 }}>
      <h2 style={{ fontSize: "1.15rem", margin: 0 }}>{title}</h2>
      <div style={{ color: "var(--muted)", lineHeight: 1.65, fontSize: ".92rem", display: "grid", gap: 8 }}>{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: 760 }}>
      <header>
        <h1 style={{ fontSize: "2.2rem", margin: 0, textTransform: "uppercase" }}>Privacy Policy</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>Last updated {UPDATED}</p>
      </header>

      <Section title="Who we are">
        <p>
          {SITE.name} ({SITE.domain}) is an independent, free-to-play rugby-league game and stats site
          run by Daniel Tomaro. This policy explains what information is collected when you use the site
          and how it is used. Questions? See our <Link href="/contact" style={{ color: "var(--accent)" }}>Contact page</Link>.
        </p>
      </Section>

      <Section title="Information we collect">
        <p>
          We do <strong>not</strong> require an account, and we do not ask for your name, email or any
          personal details to play.
        </p>
        <p>
          <strong>On your device (local storage):</strong> your game progress, scores, daily streaks,
          sound preference and an optional &ldquo;coach name&rdquo; you choose are saved in your
          browser&rsquo;s local storage. This stays on your device and you can clear it any time via your
          browser settings.
        </p>
        <p>
          <strong>Global leaderboards (optional):</strong> if you choose to post a score to the Hall of
          Fame, the coach name you enter and that score are sent to our leaderboard service (a Cloudflare
          Worker) so they can be shown on the public leaderboard. Don&rsquo;t enter a real name if you
          prefer to stay anonymous.
        </p>
      </Section>

      <Section title="Cookies & advertising">
        <p>
          This site shows ads served by <strong>Google AdSense</strong>. Third-party vendors, including
          Google, use cookies to serve ads based on your prior visits to this and other websites.
        </p>
        <ul style={{ margin: 0, paddingLeft: "1.1rem", display: "grid", gap: 6 }}>
          <li>Google&rsquo;s use of advertising cookies enables it and its partners to serve ads to you based on your visits to this and/or other sites.</li>
          <li>You can opt out of personalised advertising by visiting{" "}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>Google Ads Settings</a>.</li>
          <li>You can opt out of a third party&rsquo;s use of cookies for personalised advertising at{" "}
            <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>aboutads.info</a>.</li>
          <li>See how Google uses information from sites that use its services at{" "}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>policies.google.com/technologies/partner-sites</a>.</li>
        </ul>
      </Section>

      <Section title="Analytics">
        <p>
          We use <strong>Cloudflare Web Analytics</strong>, a privacy-first analytics tool that does not
          use cookies, does not fingerprint visitors and does not track you across sites. It reports only
          aggregate, anonymised metrics such as page views and referrers.
        </p>
      </Section>

      <Section title="Where the data comes from">
        <p>
          Player ratings and statistics are derived from publicly available Champion Data match feeds.
          This is sports data — it is not personal information about you, the visitor.
        </p>
      </Section>

      <Section title="Children">
        <p>
          The site is general-audience entertainment and is not directed at children under 13. We do not
          knowingly collect personal information from children.
        </p>
      </Section>

      <Section title="Your choices">
        <ul style={{ margin: 0, paddingLeft: "1.1rem", display: "grid", gap: 6 }}>
          <li>Clear your local game data any time via your browser&rsquo;s &ldquo;clear site data&rdquo; controls.</li>
          <li>Block or delete cookies in your browser settings.</li>
          <li>Opt out of personalised ads using the links above.</li>
        </ul>
      </Section>

      <Section title="Changes & contact">
        <p>
          We may update this policy from time to time; the &ldquo;last updated&rdquo; date above will
          change accordingly. For any privacy questions, reach us via the{" "}
          <Link href="/contact" style={{ color: "var(--accent)" }}>Contact page</Link>.
        </p>
      </Section>

      <p style={{ fontSize: ".8rem", color: "var(--muted)" }}>
        {SITE.name} is unofficial and not affiliated with or endorsed by the NRL, NRLW or any club.
      </p>
    </div>
  );
}
