import { useRef, useState } from "react";
import { clamp } from "../core/engine";
import { FeedbackFlash, HudChip, useCountdown, useEvery, useKey, type GameProps } from "./shared";
import { Icon } from "../components/icons";

/* ================= TARGET TAP ================= */

interface Tgt {
  id: number;
  x: number;
  y: number;
  decoy: boolean;
  life: number;
}

export function TargetTap({ paused, t, fx, onScore, onFinish }: GameProps) {
  const DURATION = 30;
  const [targets, setTargets] = useState<Tgt[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const idRef = useRef(1);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onFinish({ score: Math.max(0, score), correct: hits, total: hits + misses, duration: DURATION * 1000 });
  };
  const timeLeft = useCountdown(DURATION, paused, finish);

  // spawn
  useEvery(760, !paused && timeLeft > 0, () => {
    setTargets((ts) => {
      if (ts.length >= 5) return ts;
      const id = idRef.current++;
      return [...ts, { id, x: 6 + Math.random() * 80, y: 8 + Math.random() * 72, decoy: Math.random() < 0.3, life: 1600 }];
    });
  });

  const targetsRef = useRef<Tgt[]>([]);
  targetsRef.current = targets;

  // lifetime sweep
  useEvery(200, !paused && timeLeft > 0, () => {
    let expiredTargets = 0;
    const cur = targetsRef.current;
    const next = cur
      .map((x) => ({ ...x, life: x.life - 200 }))
      .filter((x) => {
        if (x.life <= 0) {
          if (!x.decoy) expiredTargets++;
          return false;
        }
        return true;
      });
    if (next.length !== cur.length) setTargets(next);
    if (expiredTargets > 0) {
      setCombo(0);
      setMisses((m) => m + expiredTargets);
    }
  });

  const tap = (id: number) => {
    if (paused || done.current) return;
    const tgt = targetsRef.current.find((x) => x.id === id);
    if (!tgt) return;
    setTargets((ts) => ts.filter((x) => x.id !== id));
    if (tgt.decoy) {
      fx("bad");
      setCombo(0);
      setMisses((m) => m + 1);
      const ns = Math.max(0, score - 150);
      setScore(ns);
      onScore(ns, 0);
    } else {
      const mult = Math.min(5, 1 + Math.floor(combo / 4));
      fx("good");
      setHits((h) => h + 1);
      setCombo((c) => c + 1);
      const ns = score + 100 * mult;
      setScore(ns);
      onScore(ns, combo + 1);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="timer" label={`${timeLeft}s`} tone={timeLeft <= 5 ? "text-bad" : "text-gold"} />
        <HudChip icon="target" label={`${t("gameui.found")}: ${hits}`} tone="text-good" />
        {combo >= 4 && <HudChip icon="zap" label={`${t("common.combo")} ×${Math.min(5, 1 + Math.floor(combo / 4))}`} tone="text-acc" />}
      </div>
      <div className="relative h-[280px] w-full overflow-hidden rounded-lg border border-line bg-raise/50 sm:h-[340px] sm:rounded-xl md:h-[400px]" aria-label={t("game.target-tap.name")}>
        <div className="bg-grid absolute inset-0 opacity-40" aria-hidden="true" />
        {targets.map((x) => (
          <button
            key={x.id}
            onClick={() => tap(x.id)}
            aria-label={x.decoy ? "decoy" : "target"}
            className={`anim-pop absolute grid size-10 place-items-center rounded-full border-2 shadow-md transition-opacity sm:size-12 md:size-14 ${
              x.decoy ? "border-bad/70 bg-bad/15 text-bad" : "border-acc bg-acc/15 text-acc hover:bg-acc/30"
            } ${x.life < 450 ? "opacity-40" : ""}`}
            style={{ left: `${x.x}%`, top: `${x.y}%` }}
          >
            {x.decoy ? <Icon name="x" size={18} strokeWidth={3} className="sm:hidden" /> : <span className="block size-3 rounded-full bg-acc sm:size-4" />}
            {x.decoy && <Icon name="x" size={22} strokeWidth={3} className="hidden sm:block" />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================= VISUAL SCAN ================= */

const SCAN_TARGET = "b";
const SCAN_DISTRACTORS = ["d", "p", "q"];

export function VisualScan({ paused, t, fx, onScore, onFinish }: GameProps) {
  const DURATION = 45;
  const CELLS = 54;
  const N_TARGETS = 10;
  const [board] = useState(() => {
    const b: string[] = Array.from({ length: CELLS }, () => SCAN_DISTRACTORS[Math.floor(Math.random() * 3)]);
    const idxs = new Set<number>();
    while (idxs.size < N_TARGETS) idxs.add(Math.floor(Math.random() * CELLS));
    idxs.forEach((i) => (b[i] = SCAN_TARGET));
    return b;
  });
  const [found, setFound] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const done = useRef(false);

  const finish = (finalScore: number, elapsed: number) => {
    if (done.current) return;
    done.current = true;
    const final = Math.max(0, finalScore);
    onScore(final, 0);
    onFinish({ score: final, correct: N_TARGETS, total: N_TARGETS + wrong.size, duration: elapsed * 1000 });
  };
  const timeLeft = useCountdown(DURATION, paused, () => finish(score, DURATION));

  const tap = (i: number) => {
    if (paused || done.current || found.has(i) || wrong.has(i)) return;
    if (board[i] === SCAN_TARGET) {
      fx("good");
      const nf = new Set(found).add(i);
      setFound(nf);
      const ns = score + 100;
      setScore(ns);
      onScore(ns, nf.size);
      if (nf.size === N_TARGETS) finish(ns + timeLeft * 10, DURATION - timeLeft);
    } else {
      fx("bad");
      setWrong(new Set(wrong).add(i));
      const ns = Math.max(0, score - 50);
      setScore(ns);
      onScore(ns, 0);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <HudChip icon="timer" label={`${timeLeft}s`} tone={timeLeft <= 5 ? "text-bad" : "text-gold"} />
        <HudChip icon="target" label={`${found.size}/${N_TARGETS}`} tone="text-good" />
        <span className="ms-auto flex items-center gap-2 rounded-lg bg-acc/10 px-3 py-1.5 text-sm font-black text-acc" dir="ltr">
          <span className="font-mono text-lg leading-none">{SCAN_TARGET}</span> = target
        </span>
      </div>
      <div className="grid grid-cols-9 gap-0.5 sm:gap-1 md:gap-1.5" role="group" aria-label={t("game.visual-scan.name")}>
        {board.map((ch, i) => {
          const isFound = found.has(i);
          const isWrong = wrong.has(i);
          return (
            <button
              key={i}
              onClick={() => tap(i)}
              disabled={paused || isFound || isWrong}
              aria-label={isFound ? "found" : `cell ${i + 1}`}
              className={`flex aspect-square items-center justify-center rounded-sm border font-mono text-xs font-bold transition-all duration-150 sm:rounded-md sm:text-sm md:text-lg ${
                isFound
                  ? "border-good bg-good/15 text-good"
                  : isWrong
                    ? "border-bad/60 bg-bad/10 text-bad/60"
                    : "border-line bg-surface hover:border-acc hover:text-acc"
              }`}
            >
              {ch}
            </button>
          );
        })}
      </div>
    </div>
  );
}
