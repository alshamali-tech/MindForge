// Pure, framework-free engine utilities: seeded RNG, shuffling, dates, streaks.

export type Rng = () => number;

/** Deterministic PRNG (mulberry32). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rngFrom(key: string): Rng {
  return mulberry32(hashStr(key));
}

export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pick<T>(arr: readonly T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Local date key YYYY-MM-DD. */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return todayKey(new Date(y, m - 1, d + n));
}

/** Consecutive completed days ending today or yesterday. */
export function computeStreak(doneDays: string[]): { current: number; longest: number } {
  const set = new Set(doneDays);
  let longest = 0;
  let run = 0;
  const sorted = doneDays.slice().sort();
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && addDays(sorted[i - 1], 1) === sorted[i]) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
  }
  let current = 0;
  let cursor = todayKey();
  if (!set.has(cursor)) cursor = addDays(cursor, -1);
  while (set.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}

export function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function fmtDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 1) return "<1m";
  if (totalMin < 60) return `${totalMin}m`;
  return `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;
}

/** Score normalization: reaction-style games map an average ms onto 0..1000. */
export function reactionScore(avgMs: number): number {
  if (avgMs <= 200) return 1000;
  if (avgMs >= 900) return 100;
  return Math.round(1000 - ((avgMs - 200) / 700) * 900);
}
