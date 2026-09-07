import { rngFrom, pick } from "./engine";

export type CategoryId = "memory" | "focus" | "speed" | "logic" | "language";

export interface CategoryMeta {
  id: CategoryId;
  nameKey: string;
  blurbKey: string;
  text: string; // tailwind text color token
  bg: string; // tailwind bg color token
  softBg: string;
  icon: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "memory", nameKey: "cat.memory", blurbKey: "cat.memory.blurb", text: "text-cmemory", bg: "bg-cmemory", softBg: "bg-cmemory/10", icon: "brain" },
  { id: "focus", nameKey: "cat.focus", blurbKey: "cat.focus.blurb", text: "text-cfocus", bg: "bg-cfocus", softBg: "bg-cfocus/10", icon: "target" },
  { id: "speed", nameKey: "cat.speed", blurbKey: "cat.speed.blurb", text: "text-cspeed", bg: "bg-cspeed", softBg: "bg-cspeed/10", icon: "bolt" },
  { id: "logic", nameKey: "cat.logic", blurbKey: "cat.logic.blurb", text: "text-clogic", bg: "bg-clogic", softBg: "bg-clogic/10", icon: "puzzle" },
  { id: "language", nameKey: "cat.language", blurbKey: "cat.language.blurb", text: "text-clanguage", bg: "bg-clanguage", softBg: "bg-clanguage/10", icon: "book" },
];

export const catById = (id: string): CategoryMeta =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];

export interface GameMeta {
  id: string;
  cat: CategoryId;
  nameKey: string;
  descKey: string;
  howKey: string;
  keysKey: string;
  est: string; // est. duration label key
}

const g = (id: string, cat: CategoryId, est: string): GameMeta => ({
  id,
  cat,
  nameKey: `game.${id}.name`,
  descKey: `game.${id}.desc`,
  howKey: `game.${id}.how`,
  keysKey: `game.${id}.keys`,
  est,
});

export const GAMES: GameMeta[] = [
  g("card-match", "memory", "est.short"),
  g("sequence-recall", "memory", "est.variable"),
  g("object-position", "memory", "est.short"),
  g("target-tap", "focus", "est.timed30"),
  g("stroop", "focus", "est.timed45"),
  g("visual-scan", "focus", "est.timed45"),
  g("rapid-sort", "speed", "est.timed30"),
  g("quick-match", "speed", "est.timed30"),
  g("reaction-grid", "speed", "est.short"),
  g("pattern-complete", "logic", "est.rounds8"),
  g("odd-one-out", "logic", "est.rounds10"),
  g("rule-switch", "logic", "est.timed40"),
  g("word-scramble", "language", "est.timed90"),
  g("mental-math", "language", "est.timed60"),
  g("number-sequence", "language", "est.rounds8"),
];

export const gameById = (id: string): GameMeta | undefined => GAMES.find((x) => x.id === id);
export const gamesByCat = (cat: CategoryId): GameMeta[] => GAMES.filter((x) => x.cat === cat);

/** Daily workout: one deterministic game per category, seeded by the date. */
export function dailyWorkout(dateKey: string): string[] {
  return CATEGORIES.map((c) => {
    const pool = gamesByCat(c.id);
    return pick(pool, rngFrom(`mindforge-daily-${dateKey}-${c.id}`)).id;
  });
}
