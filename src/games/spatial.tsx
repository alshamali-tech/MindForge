import { useEffect, useRef, useState } from "react";
import { mulberry32, randInt, shuffle } from "../core/engine";
import { HudChip, useCountdown, useEvery, useKey, type GameProps } from "./shared";

/* ================= MENTAL ROTATION ================= */

const SHAPES = [
  // L-shape
  "M0,0 L10,0 L10,30 L30,30 L30,40 L0,40 Z",
  // T-shape
  "M0,0 L30,0 L30,10 L20,10 L20,40 L10,40 L10,10 L0,10 Z",
  // Arrow
  "M15,0 L30,20 L20,20 L20,40 L10,40 L10,20 L0,20 Z",
  // Z-shape
  "M0,0 L30,0 L30,10 L10,10 L10,30 L30,30 L30,40 L0,40 L0,30 L20,30 L20,10 L0,10 Z",
];

function ShapeSvg({ path, rot, flip, color }: { path: string; rot: number; flip: boolean; color: string }) {
  return (
    <svg viewBox="0 0 40 40" className="size-32 sm:size-40" aria-hidden="true">
      <g transform={`translate(20 20) rotate(${rot}) ${flip ? "scale(-1 1)" : ""} translate(-20 -20)`}>
        <path d={path} fill={color} />
      </g>
    </svg>
  );
}

export function MentalRotation({ paused, t, fx, onScore, onFinish }: GameProps) {
  const DURATION = 45;
  const [round, setRound] = useState(0);
  const [shapeIdx, setShapeIdx] = useState(0);
  const [rot1, setRot1] = useState(0);
  const [rot2, setRot2] = useState(0);
  const [isMirror, setIsMirror] = useState(false);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [tries, setTries] = useState(0);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const done = useRef(false);

  const genRound = () => {
    const rng = mulberry32(Date.now() % 100000 + round);
    const si = randInt(rng, 0, SHAPES.length - 1);
    const r1 = randInt(rng, 0, 359);
    const r2 = randInt(rng, 0, 359);
    const mirror = rng() < 0.5;
    setShapeIdx(si);
    setRot1(r1);
    setRot2(r2);
    setIsMirror(mirror);
  };

  useEffect(() => genRound(), [round]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onFinish({ score: Math.max(0, score), correct: hits, total: tries, duration: DURATION * 1000 });
  };
  const timeLeft = useCountdown(DURATION, paused, finish);

  const answer = (saysMirror: boolean) => {
    if (paused || done.current || timeLeft <= 0 || flash) return;
    const right = saysMirror === isMirror;
    setTries((v) => v + 1);
    setFlash(right ? "good" : "bad");
    if (right) {
      fx("good");
      setHits((h) => h + 1);
      setScore((s) => {
        const ns = s + 100;
        onScore(ns, 0);
        return ns;
      });
    } else {
      fx("bad");
      setScore((s) => {
        const ns = Math.max(0, s - 50);
        onScore(ns, 0);
        return ns;
      });
    }
    window.setTimeout(() => {
      setFlash(null);
      setRound((r) => r + 1);
    }, 300);
  };

  useKey((e) => {
    if (e.key === "ArrowLeft") answer(false);
    if (e.key === "ArrowRight") answer(true);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="timer" label={`${timeLeft}s`} tone={timeLeft <= 5 ? "text-bad" : "text-gold"} />
        <HudChip icon="check" label={`${hits}/${tries}`} tone="text-good" />
      </div>
      <div className={`flex items-center justify-center gap-8 rounded-xl border border-line bg-surface py-8 ${flash === "bad" ? "anim-shake" : ""}`}>
        <ShapeSvg path={SHAPES[shapeIdx]} rot={rot1} flip={false} color="var(--acc)" />
        <ShapeSvg path={SHAPES[shapeIdx]} rot={rot2} flip={isMirror} color="var(--acc)" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => answer(false)} disabled={paused} className="btn-press min-h-[56px] rounded-xl bg-acc text-lg font-black text-white">
          ← {t("game.mental-rotation.same")}
        </button>
        <button onClick={() => answer(true)} disabled={paused} className="btn-press min-h-[56px] rounded-xl bg-gold text-lg font-black text-white">
          {t("game.mental-rotation.mirror")} →
        </button>
      </div>
    </div>
  );
}

/* ================= MAZE NAVIGATOR ================= */

export function MazeNavigator({ paused, t, fx, onScore, onFinish }: GameProps) {
  const SIZE = 9;
  const [maze, setMaze] = useState<boolean[][]>(() => genMaze(SIZE));
  const [pos, setPos] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const done = useRef(false);

  function genMaze(size: number): boolean[][] {
    // simple random maze with walls
    const rng = mulberry32(Date.now() % 100000);
    const m: boolean[][] = [];
    for (let r = 0; r < size; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < size; c++) {
        row.push(rng() < 0.3); // true = wall
      }
      m.push(row);
    }
    m[0][0] = false; // start
    m[size - 1][size - 1] = false; // goal
    return m;
  }

  const move = (dr: number, dc: number) => {
    if (paused || done.current) return;
    const nr = pos.r + dr;
    const nc = pos.c + dc;
    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) return;
    if (maze[nr][nc]) return; // wall
    fx("click");
    setPos({ r: nr, c: nc });
    setMoves((m) => m + 1);
    if (nr === SIZE - 1 && nc === SIZE - 1) {
      done.current = true;
      const finalScore = Math.max(100, 1000 - moves * 20);
      setScore(finalScore);
      onScore(finalScore, 0);
      fx("win");
      window.setTimeout(() => {
        onFinish({ score: finalScore, correct: 1, total: 1, duration: moves * 1000 });
      }, 600);
    }
  };

  useKey((e) => {
    if (e.key === "ArrowUp") { e.preventDefault(); move(-1, 0); }
    if (e.key === "ArrowDown") { e.preventDefault(); move(1, 0); }
    if (e.key === "ArrowLeft") { e.preventDefault(); move(0, -1); }
    if (e.key === "ArrowRight") { e.preventDefault(); move(0, 1); }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="refresh" label={t("game.maze-navigator.moves", { n: moves })} />
        <HudChip icon="star" label={`${score}`} tone="text-acc" />
      </div>
      <div className="flex items-center justify-center rounded-xl border border-line bg-surface p-4">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}>
          {maze.map((row, r) =>
            row.map((wall, c) => {
              const isStart = r === 0 && c === 0;
              const isGoal = r === SIZE - 1 && c === SIZE - 1;
              const isPos = pos.r === r && pos.c === c;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => {
                    if (Math.abs(pos.r - r) + Math.abs(pos.c - c) === 1) move(r - pos.r, c - pos.c);
                  }}
                  disabled={paused}
                  className={`grid size-8 place-items-center rounded text-xs font-black transition-all sm:size-10 ${
                    wall ? "bg-raise" : isGoal ? "bg-bad text-white" : isStart ? "bg-good text-white" : isPos ? "bg-acc text-white scale-110" : "bg-surface hover:bg-raise"
                  }`}
                  aria-label={wall ? "wall" : isGoal ? "goal" : isStart ? "start" : "path"}
                >
                  {isGoal ? "🎯" : isStart ? "🟢" : isPos ? "●" : ""}
                </button>
              );
            })
          )}
        </div>
      </div>
      <p className="text-center text-xs text-mut">{t("game.maze-navigator.keys")}</p>
    </div>
  );
}

/* ================= MIRROR IMAGE ================= */

const PATTERNS = [
  [1, 0, 1, 0, 1],
  [0, 1, 1, 1, 0],
  [1, 1, 0, 1, 1],
  [0, 1, 0, 1, 0],
  [1, 0, 0, 0, 1],
];

export function MirrorImage({ paused, t, fx, onScore, onFinish }: GameProps) {
  const ROUNDS = 8;
  const [round, setRound] = useState(0);
  const [pattern, setPattern] = useState<number[]>(PATTERNS[0]);
  const [options, setOptions] = useState<number[][]>([]);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const done = useRef(false);

  const genRound = () => {
    const rng = mulberry32(Date.now() % 100000 + round);
    const pIdx = randInt(rng, 0, PATTERNS.length - 1);
    const p = PATTERNS[pIdx];
    const mirror = [...p].reverse();
    const opts: number[][] = [mirror];
    // add 3 distractors
    for (let i = 0; i < 3; i++) {
      const dp = PATTERNS[(pIdx + i + 1) % PATTERNS.length];
      opts.push(dp);
    }
    const shuffled = shuffle(opts, rng);
    setPattern(p);
    setOptions(shuffled);
    setCorrectIdx(shuffled.indexOf(mirror));
    setPicked(null);
  };

  useEffect(() => genRound(), [round]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = (i: number) => {
    if (paused || done.current || picked !== null) return;
    setPicked(i);
    const right = i === correctIdx;
    if (right) {
      fx("good");
      setHits((h) => h + 1);
      setScore((s) => {
        const ns = s + 100;
        onScore(ns, 0);
        return ns;
      });
    } else {
      fx("bad");
    }
    window.setTimeout(() => {
      if (round + 1 >= ROUNDS) {
        if (!done.current) {
          done.current = true;
          onFinish({ score, correct: hits + (right ? 1 : 0), total: ROUNDS, duration: ROUNDS * 3000 });
        }
      } else {
        setRound((r) => r + 1);
      }
    }, 800);
  };

  useKey((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= 4) answer(n - 1);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="flag" label={`${round + 1}/${ROUNDS}`} />
        <HudChip icon="check" label={`${hits}`} tone="text-good" />
      </div>
      <div className="flex items-center justify-center rounded-xl border border-line bg-surface p-6">
        <div className="flex gap-1">
          {pattern.map((v, i) => (
            <div key={i} className={`size-10 rounded ${v ? "bg-acc" : "bg-raise"}`} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => answer(i)}
            disabled={paused || picked !== null}
            className={`relative flex min-h-[60px] items-center justify-center gap-1 rounded-xl border-2 transition-colors ${
              picked === i ? (i === correctIdx ? "border-good bg-good/15" : "border-bad bg-bad/10 anim-shake") : "border-line bg-surface hover:border-acc"
            }`}
          >
            <span className="absolute top-1 start-1.5 font-mono text-[10px] font-bold text-mut" dir="ltr">{i + 1}</span>
            <div className="flex gap-0.5">
              {opt.map((v, j) => (
                <div key={j} className={`size-6 rounded ${v ? "bg-acc" : "bg-raise"}`} />
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
