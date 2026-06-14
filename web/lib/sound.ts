/**
 * Tiny Web Audio sound kit for the spin — no audio files, just synthesised
 * blips. Muting is remembered in localStorage. The AudioContext is created
 * lazily on the first user gesture (the spin click), satisfying autoplay rules.
 */
const KEY = "nrl240:muted";
let ctx: AudioContext | null = null;

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "1";
}

export function toggleMuted(): boolean {
  const next = !isMuted();
  localStorage.setItem(KEY, next ? "1" : "0");
  return next;
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function blip(freq: number, dur: number, type: OscillatorType, gain: number) {
  if (isMuted()) return;
  const c = audio();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + dur + 0.02);
}

/** A short reel tick — call on each flicker while spinning. */
export function tick() {
  blip(220 + Math.random() * 120, 0.05, "square", 0.05);
}

/** A rising chime when the reel settles. */
export function settle() {
  if (isMuted()) return;
  [523, 659, 784].forEach((f, i) =>
    setTimeout(() => blip(f, 0.18, "triangle", 0.09), i * 70)
  );
}

/** A celebratory flourish for a perfect result. */
export function fanfare() {
  if (isMuted()) return;
  [523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => blip(f, 0.3, "triangle", 0.11), i * 110)
  );
}
