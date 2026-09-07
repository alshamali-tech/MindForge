import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "../components/icons";
import type { SfxKind } from "../core/sfx";
import type { Lang } from "../store";
import type { Rng } from "../core/engine";

export interface GameResult {
  score: number;
  correct: number;
  total: number;
  duration: number; // ms of active (unpaused) play
  detail?: string;
}

export interface GameProps {
  paused: boolean;
  lang: Lang;
  t: (key: string, vars?: Record<string, string | number>) => string;
  fx: (k: SfxKind) => void;
  onScore: (score: number, combo: number) => void;
  onFinish: (r: GameResult) => void;
}

/** Document-level keydown listener. Handler is always the latest render's. */
export function useKey(handler: (e: KeyboardEvent) => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const h = (e: KeyboardEvent) => ref.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
}

/** Interval that only runs while `active` is true — the pause contract. */
export function useEvery(ms: number, active: boolean, cb: () => void) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => ref.current(), ms);
    return () => window.clearInterval(id);
  }, [ms, active]);
}

/** Countdown in seconds, gated by pause. Calls onZero once. */
export function useCountdown(total: number, paused: boolean, onZero: () => void): number {
  const [left, setLeft] = useState(total);
  const zeroed = useRef(false);
  const onZeroRef = useRef(onZero);
  onZeroRef.current = onZero;
  useEvery(1000, !paused, () => setLeft((v) => Math.max(0, v - 1)));
  useEffect(() => {
    if (left <= 0 && !zeroed.current) {
      zeroed.current = true;
      onZeroRef.current();
    }
  }, [left]);
  return left;
}

/** Generate 4 unique numeric options including the answer, shuffled. */
export function numOptions(answer: number, rng: Rng, spread = 6): { opts: number[]; correct: number } {
  const set = new Set<number>([answer]);
  let guard = 0;
  while (set.size < 4 && guard++ < 200) {
    const delta = Math.ceil(rng() * spread) * (rng() < 0.5 ? -1 : 1);
    const cand = answer + delta;
    if (cand >= 0 && cand !== answer) set.add(cand);
  }
  let fill = 1;
  while (set.size < 4) set.add(answer + spread + fill++);
  const opts = Array.from(set);
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return { opts, correct: opts.indexOf(answer) };
}

/** Generate 4 unique string options including the answer, shuffled. */
export function strOptions(answer: string, pool: (rng: Rng) => string, rng: Rng): { opts: string[]; correct: number } {
  const set = new Set<string>([answer]);
  let guard = 0;
  while (set.size < 4 && guard++ < 300) set.add(pool(rng));
  const opts = Array.from(set);
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return { opts, correct: opts.indexOf(answer) };
}

export function HudChip({ icon, label, tone = "text-ink" }: { icon: string; label: ReactNode; tone?: string }) {
  return (
    <div className={`flex min-w-0 items-center gap-1.5 rounded-lg bg-raise px-2.5 py-1.5 text-xs font-bold ${tone}`}>
      <Icon name={icon} size={14} className="shrink-0 opacity-70" />
      <span className="tabular truncate">{label}</span>
    </div>
  );
}

export function FeedbackFlash({ state }: { state: "good" | "bad" | null }) {
  if (!state) return null;
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 rounded-xl anim-fadeIn ${state === "good" ? "bg-good/10" : "bg-bad/10"}`}
      aria-hidden="true"
    />
  );
}
