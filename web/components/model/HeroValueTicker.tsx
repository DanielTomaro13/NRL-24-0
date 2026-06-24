"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BOOKS, type ValuePick } from "@/lib/model";

/** Rotating "value pick" chip for the hero — cycles the model's top edges. */
export default function HeroValueTicker({ picks }: { picks: ValuePick[] }) {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (picks.length < 2) return;
    const t = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setI((x) => (x + 1) % picks.length);
        setShow(true);
      }, 280);
    }, 4200);
    return () => clearInterval(t);
  }, [picks.length]);

  if (!picks.length) return null;
  const p = picks[i];

  return (
    <Link
      href="/model"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        width: "fit-content",
        maxWidth: "100%",
        padding: ".5rem .85rem",
        borderRadius: 999,
        border: "1px solid var(--border)",
        background: "var(--panel)",
        color: "var(--text)",
        fontSize: ".85rem",
      }}
    >
      <span
        aria-hidden
        style={{ width: 8, height: 8, borderRadius: 999, background: "var(--accent-2)", boxShadow: "0 0 0 0 rgba(95,208,138,0.6)", animation: "pulse 1.8s infinite" }}
      />
      <span style={{ color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", fontSize: ".68rem", flexShrink: 0 }}>
        Model value
      </span>
      <span
        style={{
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(4px)",
          transition: "opacity .25s ease, transform .25s ease",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        <b>{p.player}</b>{" "}
        <span style={{ color: "var(--muted)" }}>{p.market}{p.line != null ? ` ${p.line}` : ""}</span>{" "}
        <b style={{ color: "var(--accent-2)" }}>+{p.ev.toFixed(0)}%</b>{" "}
        <span style={{ color: "var(--muted)" }}>{p.book ? BOOKS[p.book] ?? p.book : ""}</span>
      </span>
      <style>{`@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(95,208,138,.5)}70%{box-shadow:0 0 0 7px rgba(95,208,138,0)}100%{box-shadow:0 0 0 0 rgba(95,208,138,0)}}`}</style>
    </Link>
  );
}
