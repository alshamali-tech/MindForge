import { rngFrom, pick } from "./engine";

export type CategoryId = "memory" | "words" | "speed" | "focus" | "logic" | "spatial" | "math";

export interface CategoryMeta {
  id: CategoryId;
  nameKey: string;
  blurbKey: string;
  text: string;
  bg: string;
  softBg: string;
  icon: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "memory", nameKey: "cat.memory", blurbKey: "cat.memory.blurb", text: "text-cmemory", bg: "bg-cmemory", softBg: "bg-cmemory/10", icon: "brain" },
  { id: "words", nameKey: "cat.words", blurbKey: "cat.words.blurb", text: "text-cwords", bg: "bg-cwords", softBg: "bg-cwords/10", icon: "book" },
  { id: "speed", nameKey: "cat.speed", blurbKey: "cat.speed.blurb", text: "text-cspeed", bg: "bg-cspeed", softBg: "bg-cspeed/10", icon: "bolt" },
  { id: "focus", nameKey: "cat.focus", blurbKey: "cat.focus.blurb", text: "text-cfocus", bg: "bg-cfocus", softBg: "bg-cfocus/10", icon: "target" },
  { id: "logic", nameKey: "cat.logic", blurbKey: "cat.logic.blurb", text: "text-clogic", bg: "bg-clogic", softBg: "bg-clogic/10", icon: "puzzle" },
  { id: "spatial", nameKey: "cat.spatial", blurbKey: "cat.spatial.blurb", text: "text-cspatial", bg: "bg-cspatial", softBg: "bg-cspatial/10", icon: "globe" },
  { id: "math", nameKey: "cat.math", blurbKey: "cat.math.blurb", text: "text-cmath", bg: "bg-cmath", softBg: "bg-cmath/10", icon: "hash" },
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
  est: string;
  researchKey: string;
}

const g = (id: string, cat: CategoryId, est: string): GameMeta => ({
  id,
  cat,
  nameKey: `game.${id}.name`,
  descKey: `game.${id}.desc`,
  howKey: `game.${id}.how`,
  keysKey: `game.${id}.keys`,
  est,
  researchKey: `research.${id}`,
});

export const GAMES: GameMeta[] = [
  // Memory
  g("card-match", "memory", "est.short"),
  g("sequence-recall", "memory", "est.variable"),
  g("n-back", "memory", "est.timed60"),
  g("object-position", "memory", "est.short"),
  // Words
  g("crossword", "words", "est.long"),
  g("word-scramble", "words", "est.timed90"),
  g("word-search", "words", "est.timed120"),
  g("vocab-match", "words", "est.timed60"),
  // Speed
  g("rapid-sort", "speed", "est.timed30"),
  g("quick-match", "speed", "est.timed30"),
  g("reaction-grid", "speed", "est.short"),
  g("speed-find", "speed", "est.timed30"),
  // Focus
  g("stroop-challenge", "focus", "est.timed30"),
  g("target-tap", "focus", "est.timed30"),
  g("visual-scan", "focus", "est.timed45"),
  g("distraction-filter", "focus", "est.timed30"),
  // Logic
  g("pattern-complete", "logic", "est.short"),
  g("rule-switch", "logic", "est.timed45"),
  g("odd-one-out", "logic", "est.timed45"),
  g("sudoku", "logic", "est.long"),
  // Spatial
  g("mental-rotation", "spatial", "est.timed45"),
  g("maze-navigator", "spatial", "est.short"),
  g("mirror-image", "spatial", "est.timed30"),
  // Math
  g("mental-math", "math", "est.timed60"),
  g("number-sequence", "math", "est.short"),
  g("number-grid", "math", "est.timed45"),
];

export const gameById = (id: string): GameMeta | undefined => GAMES.find((x) => x.id === id);
export const gamesByCat = (cat: CategoryId): GameMeta[] => GAMES.filter((x) => x.cat === cat);

/** Daily workout: 7 games, one per category, date-seeded. */
export function dailyWorkout(dateKey: string): string[] {
  const rng = rngFrom(`daily-${dateKey}`);
  return CATEGORIES.map((c) => {
    const pool = gamesByCat(c.id);
    return pick(pool, rng).id;
  });
}
