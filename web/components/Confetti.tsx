"use client";
import { useEffect, useState } from "react";

const COLORS = ["#ff5436", "#e8c469", "#5fd08a", "#38bdf8", "#a855f7"];

/** Lightweight CSS confetti burst for big wins (24–0). */
export default function Confetti() {
  const [parts, setParts] = useState<
    { left: number; delay: number; dur: number; color: string; rot: number }[]
  >([]);
  useEffect(() => {
    setParts(
      Array.from({ length: 90 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 2.6 + Math.random() * 1.8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rot: Math.random() * 360,
      }))
    );
  }, []);
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100, overflow: "hidden" }}>
      <style>{`@keyframes confetti-fall { 0%{transform:translateY(-12vh) rotate(0)} 100%{transform:translateY(112vh) rotate(720deg)} }`}</style>
      {parts.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: 8,
            height: 12,
            background: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rot}deg)`,
            animation: `confetti-fall ${p.dur}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
