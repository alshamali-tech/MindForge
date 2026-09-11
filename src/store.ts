import { create } from "zustand";
import type { CategoryId } from "./core/games";
import { gameById } from "./core/games";
import { computeStreak } from "./core/engine";

/* ---------------- persistence helpers ---------------- */

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — app keeps working in-memory */
  }
}

const bc: BroadcastChannel | null =
  typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("mindforge-sync") : null;

/* ---------------- settings ---------------- */

export type Theme = "light" | "dark" | "system";
export type Lang = "en" | "ar";

interface SettingsState {
  theme: Theme;
  lang: Lang;
  sound: boolean;
  setTheme: (t: Theme) => void;
  setLang: (l: Lang) => void;
  setSound: (s: boolean) => void;
  hydrate: (s: Partial<Pick<SettingsState, "theme" | "lang" | "sound">>) => void;
}

export const useSettings = create<SettingsState>((set, get) => ({
  theme: load<Theme>("mf.theme", "system"),
  lang: load<Lang>("mf.lang", "en"),
  sound: load<boolean>("mf.sound", true),
  setTheme: (theme) => {
    set({ theme });
    save("mf.theme", theme);
    bc?.postMessage({ type: "settings", patch: { theme } });
  },
  setLang: (lang) => {
    set({ lang });
    save("mf.lang", lang);
    bc?.postMessage({ type: "settings", patch: { lang } });
  },
  setSound: (sound) => {
    set({ sound });
    save("mf.sound", sound);
    bc?.postMessage({ type: "settings", patch: { sound } });
  },
  hydrate: (patch) => set(patch),
}));

/* ---------------- score history (cache — the JSON export is the source of truth) ---------------- */

export interface ScoreEntry {
  id: string;
  gameId: string;
  cat: CategoryId;
  score: number;
  correct: number;
  total: number;
  duration: number; // ms
  ts: number;
}

interface HistoryState {
  scores: ScoreEntry[];
  addScore: (e: Omit<ScoreEntry, "id">) => ScoreEntry;
  replaceScores: (s: ScoreEntry[]) => void;
  clearAll: () => void;
  hydrate: (s: ScoreEntry[]) => void;
}

export const useHistory = create<HistoryState>((set, get) => ({
  scores: load<ScoreEntry[]>("mf.scores", []),
  addScore: (e) => {
    const entry: ScoreEntry = { ...e, id: `${e.ts}-${Math.random().toString(36).slice(2, 8)}` };
    let next = [entry, ...get().scores];
    if (next.length > 5000) next = next.slice(0, 4000); // prune oldest 1000
    set({ scores: next });
    save("mf.scores", next);
    bc?.postMessage({ type: "scores", scores: next });
    return entry;
  },
  replaceScores: (s) => {
    const next = s.slice(0, 5000);
    set({ scores: next });
    save("mf.scores", next);
    bc?.postMessage({ type: "scores", scores: next });
  },
  clearAll: () => {
    set({ scores: [] });
    save("mf.scores", []);
    bc?.postMessage({ type: "scores", scores: [] });
  },
  hydrate: (scores) => set({ scores }),
}));

/* ---------------- meta (streaks, daily progress, donation timing) ---------------- */

export interface DayProgress {
  done: string[];
  score: number;
}

interface MetaState {
  lastVisit: string | null;
  sessionCount: number;
  lastDonateToast: number;
  onboarded: boolean;
  hadScores: boolean;
  daily: Record<string, DayProgress>;
  touchVisit: () => void;
  bumpSession: () => number;
  markDonateToast: () => void;
  setOnboarded: () => void;
  setHadScores: () => void;
  completeDailyGame: (day: string, gameId: string, score: number) => void;
}

export const useMeta = create<MetaState>((set, get) => ({
  ...load<Omit<MetaState, "touchVisit" | "bumpSession" | "markDonateToast" | "setOnboarded" | "setHadScores" | "completeDailyGame">>("mf.meta", {
    lastVisit: null,
    sessionCount: 0,
    lastDonateToast: 0,
    onboarded: false,
    hadScores: false,
    daily: {},
  }),
  touchVisit: () => {
    const today = new Date().toDateString();
    set({ lastVisit: today });
    persistMeta(get);
  },
  bumpSession: () => {
    const n = get().sessionCount + 1;
    set({ sessionCount: n });
    persistMeta(get);
    return n;
  },
  markDonateToast: () => {
    set({ lastDonateToast: Date.now() });
    persistMeta(get);
  },
  setOnboarded: () => {
    set({ onboarded: true });
    persistMeta(get);
  },
  setHadScores: () => {
    set({ hadScores: true });
    persistMeta(get);
  },
  completeDailyGame: (day, gameId, score) => {
    const daily = { ...get().daily };
    const cur = daily[day] ?? { done: [], score: 0 };
    if (cur.done.includes(gameId)) return;
    daily[day] = { done: [...cur.done, gameId], score: cur.score + score };
    // keep only last 60 days
    const keys = Object.keys(daily).sort();
    while (keys.length > 60) delete daily[keys.shift() as string];
    set({ daily });
    persistMeta(get);
    bc?.postMessage({ type: "meta", daily });
  },
}));

function persistMeta(get: () => MetaState) {
  const { lastVisit, sessionCount, lastDonateToast, onboarded, hadScores, daily } = get();
  save("mf.meta", { lastVisit, sessionCount, lastDonateToast, onboarded, hadScores, daily });
}

export function streakInfo(daily: Record<string, DayProgress>) {
  const full = Object.entries(daily)
    .filter(([, v]) => v.done.length >= 6)
    .map(([k]) => k);
  return computeStreak(full);
}

/* ---------------- ui (toasts) ---------------- */

export interface Toast {
  id: number;
  kind: "info" | "success" | "error" | "donate";
  text: string;
  actionText?: string;
  actionHref?: string;
  sticky?: boolean;
}

interface UIState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

let toastId = 1;

export const useUI = create<UIState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = toastId++;
    set({ toasts: [...get().toasts, { ...t, id }] });
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((x) => x.id !== id) }),
}));

/* ---------------- cross-tab sync ---------------- */

bc?.addEventListener("message", (ev: MessageEvent) => {
  const msg = ev.data as { type: string; patch?: Partial<Record<"theme" | "lang" | "sound", unknown>>; scores?: ScoreEntry[]; daily?: Record<string, DayProgress> };
  if (!msg || typeof msg !== "object") return;
  if (msg.type === "settings" && msg.patch) useSettings.getState().hydrate(msg.patch as never);
  if (msg.type === "scores" && Array.isArray(msg.scores)) useHistory.getState().hydrate(msg.scores);
  if (msg.type === "meta" && msg.daily) useMeta.setState({ daily: msg.daily });
});

/* ---------------- derived stats ---------------- */

export function bestScore(scores: ScoreEntry[], gameId: string): number | null {
  let best: number | null = null;
  for (const s of scores) if (s.gameId === gameId && (best === null || s.score > best)) best = s.score;
  return best;
}

export function totalStats(scores: ScoreEntry[]) {
  let time = 0;
  const perCat: Record<string, number> = {};
  for (const s of scores) {
    time += s.duration;
    perCat[s.cat] = (perCat[s.cat] ?? 0) + 1;
  }
  let fav: string | null = null;
  let favN = 0;
  for (const [k, v] of Object.entries(perCat)) if (v > favN) { fav = k; favN = v; }
  return { count: scores.length, time, fav };
}

export function last7Counts(scores: ScoreEntry[]): number[] {
  const out = [0, 0, 0, 0, 0, 0, 0];
  const now = Date.now();
  for (const s of scores) {
    const days = Math.floor((now - s.ts) / 86400000);
    if (days >= 0 && days < 7) out[6 - days] += 1;
  }
  return out;
}

export function latestForGame(scores: ScoreEntry[], gameId: string): ScoreEntry | undefined {
  return scores.find((s) => s.gameId === gameId);
}

export function gameName(gameId: string): string {
  return gameById(gameId)?.nameKey ?? gameId;
}
