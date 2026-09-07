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
      <div className="relative h-[340px] w-full overflow-hidden rounded-xl border border-line bg-raise/50 sm:h-[400px]" aria-label={t("game.target-tap.name")}>
        <div className="bg-grid absolute inset-0 opacity-40" aria-hidden="true" />
        {targets.map((x) => (
          <button
            key={x.id}
            onClick={() => tap(x.id)}
            aria-label={x.decoy ? "decoy" : "target"}
            className={`anim-pop absolute grid size-12 place-items-center rounded-full border-2 shadow-md transition-opacity sm:size-14 ${
              x.decoy ? "border-bad/70 bg-bad/15 text-bad" : "border-acc bg-acc/15 text-acc hover:bg-acc/30"
            } ${x.life < 450 ? "opacity-40" : ""}`}
            style={{ left: `${x.x}%`, top: `${x.y}%` }}
          >
            {x.decoy ? <Icon name="x" size={22} strokeWidth={3} /> : <span className="block size-4 rounded-full bg-acc" />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================= STROOP ================= */

const STROOP_COLORS = [
  { key: "col.red", text: "text-red-500", hex: "#ef4444" },
  { key: "col.blue", text: "text-blue-500", hex: "#3b82f6" },
  { key: "col.green", text: "text-green-500", hex: "#22c55e" },
  { key: "col.yellow", text: "text-yellow-500", hex: "#eab308" },
];

export function Stroop({ paused, t, fx, onScore, onFinish }: GameProps) {
  const DURATION = 45;
  const [q, setQ] = useState(() => ({ word: 0, ink: 1 + Math.floor(Math.random() * 3) }));
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

  const nextQ = () => {
    const word = Math.floor(Math.random() * 4);
    let ink = Math.floor(Math.random() * 4);
    while (ink === word) ink = Math.floor(Math.random() * 4);
    setQ({ word, ink });
  };

  const answer = (i: number) => {
    if (paused || done.current || timeLeft <= 0) return;
    setTries((v) => v + 1);
    if (i === q.ink) {
      const mult = Math.min(3, 1 + Math.floor(streak / 3));
      fx("good");
      setHits((h) => h + 1);
      setStreak((s) => s + 1);
      const ns = score + 100 * mult;
      setScore(ns);
      onScore(ns, streak + 1);
      setFlash("good");
    } else {
      fx("bad");
      setStreak(0);
      const ns = Math.max(0, score - 50);
      setScore(ns);
      onScore(ns, 0);
      setFlash("bad");
    }
    window.setTimeout(() => setFlash(null), 220);
    nextQ();
  };

  useKey((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= 4) answer(n - 1);
  });

  return (
    <div className="relative space-y-4">
      <FeedbackFlash state={flash} />
      <div className="flex flex-wrap gap-2">
        <HudChip icon="timer" label={`${timeLeft}s`} tone={timeLeft <= 5 ? "text-bad" : "text-gold"} />
        <HudChip icon="check" label={`${hits}/${tries}`} tone="text-good" />
        {streak >= 3 && <HudChip icon="zap" label={`×${Math.min(3, 1 + Math.floor(streak / 3))}`} tone="text-acc" />}
      </div>
      <div className={`flex h-36 items-center justify-center rounded-xl border border-line bg-surface sm:h-44 ${flash === "bad" ? "anim-shake" : ""}`}>
        <span className={`text-5xl font-black tracking-tight sm:text-7xl ${STROOP_COLORS[q.ink].text}`} dir="ltr">
          {t(STROOP_COLORS[q.word].key).toUpperCase()}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STROOP_COLORS.map((c, i) => (
          <button
            key={c.key}
            onClick={() => answer(i)}
            disabled={paused}
            className="btn-soft-press flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-bold hover:border-acc"
          >
            <span className="size-3.5 shrink-0 rounded-full" style={{ background: c.hex }} aria-hidden="true" />
            {t(c.key)}
            <span className="ms-auto font-mono text-[10px] text-mut" dir="ltr">{i + 1}</span>
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
      <div className="grid grid-cols-9 gap-1 sm:gap-1.5" role="group" aria-label={t("game.visual-scan.name")}>
        {board.map((ch, i) => {
          const isFound = found.has(i);
          const isWrong = wrong.has(i);
          return (
            <button
              key={i}
              onClick={() => tap(i)}
              disabled={paused || isFound || isWrong}
              aria-label={isFound ? "found" : `cell ${i + 1}`}
              className={`flex aspect-square items-center justify-center rounded-md border font-mono text-sm font-bold transition-all duration-150 sm:text-lg ${
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
