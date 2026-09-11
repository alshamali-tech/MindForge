import { useEffect, useRef, useState } from "react";
import { clamp, reactionScore } from "../core/engine";
import { HudChip, useCountdown, useEvery, useKey, type GameProps } from "./shared";
import { Kbd } from "../components/ui";

/* ================= RAPID SORT ================= */

const rand99 = () => 1 + Math.floor(Math.random() * 99);

export function RapidSort({ paused, t, fx, onScore, onFinish }: GameProps) {
  const DURATION = 30;
  const [prev, setPrev] = useState(rand99);
  const [cur, setCur] = useState(() => {
    let v = rand99();
    while (v === prev) v = rand99();
    return v;
  });
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hits, setHits] = useState(0);
  const [tries, setTries] = useState(0);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onFinish({ score: Math.max(0, score), correct: hits, total: tries, duration: DURATION * 1000 });
  };
  const timeLeft = useCountdown(DURATION, paused, finish);

  const answer = (dir: "up" | "down") => {
    if (paused || done.current || timeLeft <= 0) return;
    const right = dir === "up" ? cur > prev : cur < prev;
    setTries((v) => v + 1);
    if (right) {
      const mult = Math.min(4, 1 + Math.floor(streak / 5));
      fx("good");
      setHits((h) => h + 1);
      setStreak((s) => s + 1);
      const ns = score + 50 * mult;
      setScore(ns);
      onScore(ns, streak + 1);
      setFlash("good");
    } else {
      fx("bad");
      setStreak(0);
      const ns = Math.max(0, score - 25);
      setScore(ns);
      onScore(ns, 0);
      setFlash("bad");
    }
    window.setTimeout(() => setFlash(null), 200);
    setPrev(cur);
    let v = rand99();
    while (v === cur) v = rand99();
    setCur(v);
  };

  useKey((e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      answer("up");
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      answer("down");
    }
  });

  return (
    <div className="relative space-y-4">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="timer" label={`${timeLeft}s`} tone={timeLeft <= 5 ? "text-bad" : "text-gold"} />
        <HudChip icon="check" label={`${hits}/${tries}`} tone="text-good" />
        {streak >= 5 && <HudChip icon="zap" label={`×${Math.min(4, 1 + Math.floor(streak / 5))}`} tone="text-acc" />}
      </div>
      <div className={`flex items-end justify-center gap-3 rounded-lg border border-line bg-surface py-6 sm:gap-4 sm:rounded-xl sm:py-8 ${flash === "bad" ? "anim-shake" : ""}`}>
        <div className="text-center">
          <div className="text-[9px] font-black uppercase tracking-widest text-mut sm:text-[10px]">{t("common.back")}</div>
          <div className="tabular font-mono text-2xl font-bold text-mut sm:text-3xl md:text-4xl" dir="ltr">{prev}</div>
        </div>
        <div className="pb-2 text-mut">→</div>
        <div className="text-center">
          <div className="text-[9px] font-black uppercase tracking-widest text-acc sm:text-[10px]">?</div>
          <div key={cur} className="tabular anim-pop font-mono text-5xl font-black sm:text-6xl md:text-7xl" dir="ltr">{cur}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button onClick={() => answer("up")} disabled={paused} className="btn-press flex min-h-[56px] items-center justify-center gap-2 rounded-lg bg-acc text-base font-black text-white sm:min-h-[64px] sm:text-lg">
          <span className="text-xl sm:text-2xl" aria-hidden="true">↑</span> {t("gameui.higher")}
        </button>
        <button onClick={() => answer("down")} disabled={paused} className="btn-press flex min-h-[56px] items-center justify-center gap-2 rounded-lg bg-acc text-base font-black text-white sm:min-h-[64px] sm:text-lg">
          <span className="text-xl sm:text-2xl" aria-hidden="true">↓</span> {t("gameui.lower")}
        </button>
      </div>
      <p className="text-center text-xs text-mut">
        <Kbd>↑</Kbd> / <Kbd>↓</Kbd>
      </p>
    </div>
  );
}

/* ================= QUICK MATCH ================= */

type Shape = "circle" | "square" | "triangle" | "diamond";
interface Stim {
  shape: Shape;
  color: string;
  rot: number;
  size: number;
}

const QM_COLORS = ["#4f46e5", "#e11d48", "#d97706", "#059669"];
const QM_SHAPES: Shape[] = ["circle", "square", "triangle", "diamond"];

function randStim(): Stim {
  return {
    shape: QM_SHAPES[Math.floor(Math.random() * 4)],
    color: QM_COLORS[Math.floor(Math.random() * 4)],
    rot: [0, 90, 180, 270][Math.floor(Math.random() * 4)],
    size: Math.random() < 0.5 ? 0.78 : 1.05,
  };
}

function makePair(): { a: Stim; b: Stim; same: boolean } {
  const a = randStim();
  if (Math.random() < 0.5) return { a, b: { ...a }, same: true };
  const b = { ...a };
  const mutations: Array<() => void> = [
    () => {
      let c = a.color;
      while (c === a.color) c = QM_COLORS[Math.floor(Math.random() * 4)];
      b.color = c;
    },
    () => {
      let s = a.shape;
      while (s === a.shape) s = QM_SHAPES[Math.floor(Math.random() * 4)];
      b.shape = s;
    },
    () => (b.size = a.size > 0.9 ? 0.72 : 1.1),
  ];
  if (a.shape === "triangle") mutations.push(() => (b.rot = (a.rot + (Math.random() < 0.5 ? 90 : 180)) % 360));
  mutations[Math.floor(Math.random() * mutations.length)]();
  return { a, b, same: false };
}

function StimSvg({ s }: { s: Stim }) {
  const t = `rotate(${s.rot} 32 32) scale(${s.size}) `;
  return (
    <svg viewBox="0 0 64 64" className="size-20 sm:size-28" aria-hidden="true">
      <g transform={`translate(${32 - 32 * s.size} ${32 - 32 * s.size}) scale(${s.size}) rotate(${s.rot} 32 32)`}>
        {s.shape === "circle" && <circle cx="32" cy="32" r="22" fill={s.color} />}
        {s.shape === "square" && <rect x="10" y="10" width="44" height="44" rx="6" fill={s.color} />}
        {s.shape === "triangle" && <path d="M32 8 56 54H8z" fill={s.color} />}
        {s.shape === "diamond" && <path d="M32 6 58 32 32 58 6 32z" fill={s.color} />}
      </g>
      <title>{s.shape}</title>
      {/* keep transform var referenced for clarity */}
      <desc>{t}</desc>
    </svg>
  );
}

export function QuickMatch({ paused, t, fx, onScore, onFinish }: GameProps) {
  const DURATION = 30;
  const [pair, setPair] = useState(makePair);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hits, setHits] = useState(0);
  const [tries, setTries] = useState(0);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onFinish({ score: Math.max(0, score), correct: hits, total: tries, duration: DURATION * 1000 });
  };
  const timeLeft = useCountdown(DURATION, paused, finish);

  const answer = (saysSame: boolean) => {
    if (paused || done.current || timeLeft <= 0) return;
    const right = saysSame === pair.same;
    setTries((v) => v + 1);
    if (right) {
      const mult = Math.min(4, 1 + Math.floor(streak / 5));
      fx("good");
      setHits((h) => h + 1);
      setStreak((s) => s + 1);
      const ns = score + 60 * mult;
      setScore(ns);
      onScore(ns, streak + 1);
      setFlash("good");
    } else {
      fx("bad");
      setStreak(0);
      const ns = Math.max(0, score - 30);
      setScore(ns);
      onScore(ns, 0);
      setFlash("bad");
    }
    window.setTimeout(() => setFlash(null), 200);
    setPair(makePair());
  };

  useKey((e) => {
    if (e.key === "ArrowLeft") answer(true);
    if (e.key === "ArrowRight") answer(false);
  });

  return (
    <div className="relative space-y-4">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="timer" label={`${timeLeft}s`} tone={timeLeft <= 5 ? "text-bad" : "text-gold"} />
        <HudChip icon="check" label={`${hits}/${tries}`} tone="text-good" />
        {streak >= 5 && <HudChip icon="zap" label={`×${Math.min(4, 1 + Math.floor(streak / 5))}`} tone="text-acc" />}
      </div>
      <div key={tries} className={`anim-fadeIn flex items-center justify-center gap-6 rounded-xl border border-line bg-surface py-8 sm:gap-12 ${flash === "bad" ? "anim-shake" : ""}`}>
        <StimSvg s={pair.a} />
        <span className="text-2xl font-black text-mut" aria-hidden="true">vs</span>
        <StimSvg s={pair.b} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => answer(true)} disabled={paused} className="btn-press flex min-h-[64px] items-center justify-center gap-2 rounded-xl bg-acc text-lg font-black text-white">
          {t("gameui.same")} <span aria-hidden="true">≡</span>
        </button>
        <button onClick={() => answer(false)} disabled={paused} className="btn-press flex min-h-[64px] items-center justify-center gap-2 rounded-xl bg-gold text-lg font-black text-white">
          {t("gameui.different")} <span aria-hidden="true">≠</span>
        </button>
      </div>
      <p className="text-center text-xs text-mut">
        <Kbd>←</Kbd> {t("gameui.same")} · <Kbd>→</Kbd> {t("gameui.different")}
      </p>
    </div>
  );
}

/* ================= REACTION GRID ================= */

export function ReactionGrid({ paused, t, fx, onScore, onFinish }: GameProps) {
  const ROUNDS = 5;
  const [phase, setPhase] = useState<"wait" | "go" | "between" | "done">("wait");
  const [round, setRound] = useState(0);
  const [cell, setCell] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const [falseStart, setFalseStart] = useState(false);
  const goTime = useRef(0);
  const penalty = useRef(0);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const done = useRef(false);

  // arm the "go" moment
  useEffect(() => {
    if (phase !== "wait") return;
    let id = 0;
    const delay = 1100 + Math.random() * 1900;
    const arm = () => {
      id = window.setTimeout(() => {
        if (pausedRef.current) {
          arm();
          return;
        }
        setCell(Math.floor(Math.random() * 9));
        goTime.current = performance.now();
        setPhase("go");
      }, delay);
    };
    arm();
    return () => window.clearTimeout(id);
  }, [phase, round, falseStart]);

  // between → next round
  useEffect(() => {
    if (phase !== "between") return;
    const id = window.setTimeout(() => {
      if (round + 1 >= ROUNDS) {
        setPhase("done");
      } else {
        setRound((r) => r + 1);
        penalty.current = 0;
        setFalseStart(false);
        setPhase("wait");
      }
    }, 1050);
    return () => window.clearTimeout(id);
  }, [phase, round]);

  useEffect(() => {
    if (phase !== "done" || done.current) return;
    done.current = true;
    const avg = results.reduce((a, b) => a + b, 0) / Math.max(1, results.length);
    const score = reactionScore(avg);
    onScore(score, 0);
    const clean = results.filter((r) => r < 450).length;
    onFinish({ score, correct: clean, total: ROUNDS, duration: ROUNDS * 2600, detail: `${Math.round(avg)} ms` });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const hit = (i: number) => {
    if (paused || done.current) return;
    if (phase === "wait") {
      fx("bad");
      penalty.current += 350;
      setFalseStart(true);
      window.setTimeout(() => setFalseStart(false), 800);
      return;
    }
    if (phase !== "go") return;
    if (i === cell) {
      const ms = Math.round(performance.now() - goTime.current + penalty.current);
      fx("good");
      setResults((r) => [...r, ms]);
      setLastMs(ms);
      onScore(reactionScore(ms), 0);
      setPhase("between");
    } else {
      fx("bad");
      penalty.current += 150;
      setFalseStart(true);
      window.setTimeout(() => setFalseStart(false), 600);
    }
  };

  useKey((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= 9) hit(n - 1);
  });

  const avgSoFar = results.length ? Math.round(results.reduce((a, b) => a + b, 0) / results.length) : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <HudChip icon="flag" label={`${t("common.round")} ${Math.min(round + 1, ROUNDS)}/${ROUNDS}`} />
        {avgSoFar !== null && <HudChip icon="timer" label={`${t("gameui.avgReaction")}: ${avgSoFar} ms`} tone="text-acc" />}
        <span className="ms-auto" aria-live="polite">
          {phase === "wait" && !falseStart && <HudChip icon="clock" label={t("gameui.wait")} tone="text-mut" />}
          {phase === "go" && <HudChip icon="zap" label={t("gameui.tap")} tone="text-good" />}
          {falseStart && <HudChip icon="x" label={t("gameui.falseStart")} tone="text-bad" />}
          {phase === "between" && lastMs !== null && <HudChip icon="check" label={`${lastMs} ms`} tone="text-good" />}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3" role="group" aria-label={t("game.reaction-grid.name")}>
        {Array.from({ length: 9 }, (_, i) => (
          <button
            key={i}
            onClick={() => hit(i)}
            disabled={paused}
            aria-label={`cell ${i + 1}`}
            className={`flex aspect-square items-center justify-center rounded-xl border-2 font-mono text-xs text-mut/60 transition-all duration-100 ${
              phase === "go" && cell === i
                ? "border-good bg-good text-white scale-[1.03] shadow-lg shadow-good/30"
                : "border-line bg-raise hover:border-acc/50"
            }`}
          >
            {phase === "go" && cell === i ? "●" : i + 1}
          </button>
        ))}
      </div>
      <div className="flex min-h-[24px] flex-wrap justify-center gap-1.5">
        {results.map((r, i) => (
          <span key={i} className={`tabular rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${r < 450 ? "bg-good/12 text-good" : "bg-gold/12 text-gold"}`} dir="ltr">
            {r}ms
          </span>
        ))}
      </div>
    </div>
  );
}

// referenced to keep tree-shaking honest
void clamp;
