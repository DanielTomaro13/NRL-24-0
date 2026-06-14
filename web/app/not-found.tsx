import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "3rem 1rem", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-cond)", fontSize: "4rem", lineHeight: 1, color: "var(--accent)" }}>404</div>
      <h1 style={{ margin: "0.5rem 0", fontSize: "1.4rem" }}>That play didn&rsquo;t come off</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        The page you&rsquo;re after isn&rsquo;t here. It may have moved, or the link was mistyped.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/" className="btn" style={{ padding: ".6rem 1.1rem" }}>Home</Link>
        <Link href="/play" className="btn" style={{ padding: ".6rem 1.1rem" }}>Play Perfect Season</Link>
        <Link href="/games" className="btn" style={{ padding: ".6rem 1.1rem" }}>Mini-games</Link>
      </div>
    </main>
  );
}
