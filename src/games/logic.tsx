import { useEffect, useRef, useState } from "react";
import { mulberry32, randInt, shuffle } from "../core/engine";
import { HudChip, strOptions, useEvery, useKey, type GameProps } from "./shared";
import { Kbd } from "../components/ui";

/* ================= PATTERN COMPLETE ================= */

interface Puzzle {
  display: string[];
  opts: string[];
  correct: number;
}

function genPattern(round: number): Puzzle {
  const rng = mulberry32(Date.now() % 1000000 + round * 7919);
  const kind = ["add", "sub", "mul", "alt", "squares", "letters", "add", "fib"][round % 8];
  let seq: number[] = [];
  let letters = false;
  switch (kind) {
    case "add": {
      const s = randInt(rng, 1, 12);
      const d = randInt(rng, 2, 9);
      seq = [s, s + d, s + 2 * d, s + 3 * d, s + 4 * d];
      break;
    }
    case "sub": {
      const d = randInt(rng, 3, 9);
      const s = randInt(rng, 40, 90);
      seq = [s, s - d, s - 2 * d, s - 3 * d, s - 4 * d];
      break;
    }
    case "mul": {
      const s = randInt(rng, 1, 3);
      const r = rng() < 0.6 ? 2 : 3;
      seq = [s, s * r, s * r * r, s * r ** 3, s * r ** 4];
      break;
    }
    case "alt": {
      const s = randInt(rng, 1, 9);
      const a = randInt(rng, 2, 6);
      const b = randInt(rng, 7, 12);
      seq = [s, s + a, s + b, s + b + a, s + 2 * b, s + 2 * b + a];
      seq = seq.slice(0, 5);
      break;
    }
    case "squares": {
      const s = randInt(rng, 1, 3);
      seq = [s ** 2, (s + 1) ** 2, (s + 2) ** 2, (s + 3) ** 2, (s + 4) ** 2];
      break;
    }
    case "fib": {
      const a = randInt(rng, 1, 4);
      const b = randInt(rng, 2, 6);
      seq = [a, b, a + b, a + 2 * b, 2 * a + 3 * b];
      break;
    }
    case "letters": {
      letters = true;
      let idx = randInt(rng, 0, 4);
      const out: number[] = [idx];
      for (let g = 2; g <= 5; g++) {
        idx += g;
        out.push(idx);
      }
      seq = out;
      break;
    }
  }
  const toStr = (n: number) => (letters ? String.fromCharCode(65 + (n % 26)) : String(n));
  const display = seq.slice(0, 4).map(toStr);
  const answer = toStr(seq[4]);
  // distractors
  const distractors = new Set<string>();
  let guard = 0;
  while (distractors.size < 3 && guard++ < 200) {
    const delta = randInt(rng, 1, 4) * (rng() < 0.5 ? -1 : 1);
    if (letters) {
      const code = (seq[4] + delta + 260) % 26;
      const s = String.fromCharCode(65 + code);
      if (s !== answer) distractors.add(s);
    } else {
      const v = seq[4] + delta * (kind === "mul" ? randInt(rng, 2, 4) : 1);
      if (v >= 0 && String(v) !== answer) distractors.add(String(v));
    }
  }
  const opts = shuffle([answer, ...Array.from(distractors)], rng);
  return { display, opts, correct: opts.indexOf(answer) };
}

export function PatternComplete({ paused, t, fx, onScore, onFinish }: GameProps) {
  const ROUNDS = 8;
  const [round, setRound] = useState(0);
  const [puzzle, setPuzzle] = useState<Puzzle>(() => genPattern(0));
  const [phase, setPhase] = useState<"answer" | "reveal">("answer");
  const [picked, setPicked] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(12);
  const [score, setScore] = useState(0);
  const [correctN, setCorrectN] = useState(0);
  const done = useRef(false);
  const ticksRef = useRef(0);

  useEffect(() => setTimeLeft(12), [round]);
  useEvery(1000, !paused && phase === "answer", () => {
    ticksRef.current += 1;
    setTimeLeft((v) => Math.max(0, v - 1));
  });

  const resolve = (choice: number | null) => {
    if (phase !== "answer" || paused || done.current) return;
    const right = choice === puzzle.correct;
    setPicked(choice);
    setPhase("reveal");
    if (right) {
      const gained = 100 + timeLeft * 8;
      fx("good");
      setCorrectN((c) => c + 1);
      const ns = score + gained;
      setScore(ns);
      onScore(ns, 0);
    } else {
      fx("bad");
    }
    window.setTimeout(() => {
      if (round + 1 >= ROUNDS) {
        if (!done.current) {
          done.current = true;
          onFinish({
            score: scoreRef.current,
            correct: correctRef.current,
            total: ROUNDS,
            duration: ticksRef.current * 1000,
          });
        }
      } else {
        const nr = round + 1;
        setRound(nr);
        setPuzzle(genPattern(nr));
        setPhase("answer");
        setPicked(null);
      }
    }, 900);
  };

  useEffect(() => {
    if (timeLeft <= 0 && phase === "answer") resolve(null);
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  const scoreRef = useRef(score);
  scoreRef.current = score;
  const correctRef = useRef(correctN);
  correctRef.current = correctN;

  useKey((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= 4) resolve(n - 1);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <HudChip icon="flag" label={`${t("common.round")} ${round + 1}/${ROUNDS}`} />
        <HudChip icon="timer" label={`${timeLeft}s`} tone={timeLeft <= 3 ? "text-bad" : "text-gold"} />
        <HudChip icon="check" label={`${correctN}/${round + (phase === "reveal" ? 1 : 0)}`} tone="text-good" />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-7 sm:gap-3" dir="ltr">
        {puzzle.display.map((s, i) => (
          <span key={i} className="tabular grid size-12 place-items-center rounded-lg bg-raise font-mono text-xl font-black sm:size-14 sm:text-2xl">
            {s}
          </span>
        ))}
        <span className="grid size-12 place-items-center rounded-lg border-2 border-dashed border-acc font-mono text-2xl font-black text-acc anim-glow sm:size-14">
          ?
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {puzzle.opts.map((o, i) => {
          const isCorrect = phase === "reveal" && i === puzzle.correct;
          const isWrongPick = phase === "reveal" && picked === i && i !== puzzle.correct;
          return (
            <button
              key={`${round}-${i}`}
              onClick={() => resolve(i)}
              disabled={phase !== "answer" || paused}
              className={`btn-soft-press relative min-h-[56px] rounded-xl border-2 font-mono text-xl font-black transition-colors ${
                isCorrect ? "border-good bg-good/15 text-good" : isWrongPick ? "border-bad bg-bad/10 text-bad anim-shake" : "border-line bg-surface hover:border-acc"
              }`}
            >
              <span className="absolute top-1 start-1.5 font-sans text-[10px] font-bold text-mut" dir="ltr">{i + 1}</span>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ================= ODD ONE OUT ================= */

interface OddItem {
  label: string;
  rot?: number;
  color?: string;
  scale?: number;
}
interface OddPuzzle {
  items: OddItem[];
  odd: number;
}

function genOdd(): OddPuzzle {
  const rng = mulberry32(Date.now() % 1000000);
  const kind = randInt(rng, 0, 4);
  const odd = randInt(rng, 0, 8);
  const items: OddItem[] = [];
  const nums = new Set<number>();
  switch (kind) {
    case 0: {
      while (nums.size < 9) {
        const isOddSlot = nums.size === odd;
        let v = randInt(rng, 2, 98);
        if (isOddSlot ? v % 2 === 0 : v % 2 !== 0) v += 1;
        nums.add(v);
      }
      nums.forEach((v) => items.push({ label: String(v) }));
      break;
    }
    case 1: {
      while (nums.size < 9) {
        const isOddSlot = nums.size === odd;
        let v = randInt(rng, 1, 19) * 5;
        if (isOddSlot) v += randInt(rng, 1, 2);
        nums.add(v);
      }
      nums.forEach((v) => items.push({ label: String(v) }));
      break;
    }
    case 2: {
      for (let i = 0; i < 9; i++) items.push({ label: "▲", rot: i === odd ? 180 : 0 });
      break;
    }
    case 3: {
      const colors = ["#4f46e5", "#e11d48", "#d97706", "#059669"];
      const main = colors[randInt(rng, 0, 3)];
      let other = colors[randInt(rng, 0, 3)];
      while (other === main) other = colors[randInt(rng, 0, 3)];
      for (let i = 0; i < 9; i++) items.push({ label: "●", color: i === odd ? other : main });
      break;
    }
    case 4: {
      for (let i = 0; i < 9; i++) items.push({ label: "■", scale: i === odd ? 1.65 : 1 });
      break;
    }
  }
  return { items, odd };
}

export function OddOneOut({ paused, t, fx, onScore, onFinish }: GameProps) {
  const ROUNDS = 10;
  const [round, setRound] = useState(0);
  const [puzzle, setPuzzle] = useState<OddPuzzle>(genOdd);
  const [phase, setPhase] = useState<"answer" | "reveal">("answer");
  const [picked, setPicked] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(8);
  const [score, setScore] = useState(0);
  const [correctN, setCorrectN] = useState(0);
  const done = useRef(false);
  const ticksRef = useRef(0);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  scoreRef.current = score;
  correctRef.current = correctN;

  useEffect(() => setTimeLeft(8), [round]);
  useEvery(1000, !paused && phase === "answer", () => {
    ticksRef.current += 1;
    setTimeLeft((v) => Math.max(0, v - 1));
  });

  const advance = () => {
    if (round + 1 >= ROUNDS) {
      if (!done.current) {
        done.current = true;
        onFinish({ score: scoreRef.current, correct: correctRef.current, total: ROUNDS, duration: ticksRef.current * 1000 });
      }
    } else {
      setRound((r) => r + 1);
      setPuzzle(genOdd());
      setPhase("answer");
      setPicked(null);
    }
  };

  const resolve = (choice: number | null) => {
    if (phase !== "answer" || paused || done.current) return;
    const right = choice === puzzle.odd;
    setPicked(choice);
    setPhase("reveal");
    if (right) {
      fx("good");
      setCorrectN((c) => c + 1);
      const ns = score + 100 + timeLeft * 10;
      setScore(ns);
      onScore(ns, 0);
    } else {
      fx("bad");
      const ns = Math.max(0, score - 30);
      setScore(ns);
      onScore(ns, 0);
    }
    window.setTimeout(advance, 950);
  };

  useEffect(() => {
    if (timeLeft <= 0 && phase === "answer") resolve(null);
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  useKey((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= 9) resolve(n - 1);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <HudChip icon="flag" label={`${t("common.round")} ${round + 1}/${ROUNDS}`} />
        <HudChip icon="timer" label={`${timeLeft}s`} tone={timeLeft <= 3 ? "text-bad" : "text-gold"} />
        <HudChip icon="check" label={`${correctN}`} tone="text-good" />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {puzzle.items.map((item, i) => {
          const isOdd = phase === "reveal" && i === puzzle.odd;
          const isWrongPick = phase === "reveal" && picked === i && i !== puzzle.odd;
          return (
            <button
              key={`${round}-${i}`}
              onClick={() => resolve(i)}
              disabled={phase !== "answer" || paused}
              aria-label={`item ${i + 1}`}
              className={`relative flex aspect-square items-center justify-center rounded-xl border-2 text-3xl font-black transition-colors sm:text-4xl ${
                isOdd ? "border-good bg-good/15" : isWrongPick ? "border-bad bg-bad/10 anim-shake" : "border-line bg-surface hover:border-acc"
              }`}
              style={item.color ? { color: item.color } : undefined}
            >
              <span
                className="inline-block transition-transform"
                style={{ transform: `rotate(${item.rot ?? 0}deg) scale(${item.scale ?? 1})` }}
              >
                {item.label}
              </span>
              <span className="absolute top-1 start-1.5 font-sans text-[10px] font-bold text-mut" dir="ltr">{i + 1}</span>
              {isOdd && <span className="absolute bottom-1.5 rounded bg-good px-1.5 text-[10px] font-black text-white">✓</span>}
            </button>
          );
        })}
      </div>
      <p className="text-center text-xs text-mut">
        <Kbd>1</Kbd>–<Kbd>9</Kbd>
      </p>
    </div>
  );
}

/* ================= RULE SWITCH ================= */

const RULES = [
  { dim: "rules.dimParity", opts: ["rules.even", "rules.odd"], ans: (n: number) => (n % 2 === 0 ? 0 : 1) },
  { dim: "rules.dimSize", opts: ["rules.gt50", "rules.le50"], ans: (n: number) => (n > 50 ? 0 : 1) },
  { dim: "rules.dimFive", opts: ["rules.mul5", "rules.notmul5"], ans: (n: number) => (n % 5 === 0 ? 0 : 1) },
];

export function RuleSwitch({ paused, t, fx, onScore, onFinish }: GameProps) {
  const DURATION = 40;
  const [ruleIdx, setRuleIdx] = useState(() => Math.floor(Math.random() * 3));
  const [num, setNum] = useState(() => 1 + Math.floor(Math.random() * 99));
  const [answered, setAnswered] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hits, setHits] = useState(0);
  const [tries, setTries] = useState(0);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const [ruleFlash, setRuleFlash] = useState(false);
  const done = useRef(false);
  const ticksRef = useRef(0);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onFinish({ score: Math.max(0, score), correct: hits, total: tries, duration: ticksRef.current * 1000 });
  };

  const [timeLeft, setTimeLeft] = useState(DURATION);
  useEvery(1000, !paused, () => {
    ticksRef.current += 1;
    setTimeLeft((v) => Math.max(0, v - 1));
  });
  useEffect(() => {
    if (timeLeft <= 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const switchRule = () => {
    setRuleIdx((r) => {
      let nr = Math.floor(Math.random() * 3);
      while (nr === r) nr = Math.floor(Math.random() * 3);
      return nr;
    });
    setRuleFlash(true);
    fx("tick");
    window.setTimeout(() => setRuleFlash(false), 500);
  };

  const answer = (i: number) => {
    if (paused || done.current || timeLeft <= 0) return;
    const rule = RULES[ruleIdx];
    const right = i === rule.ans(num);
    setTries((v) => v + 1);
    const na = answered + 1;
    setAnswered(na);
    if (right) {
      const mult = Math.min(2, 1 + Math.floor(streak / 6));
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
    window.setTimeout(() => setFlash(null), 200);
    setNum(1 + Math.floor(Math.random() * 99));
    if (na % 6 === 0) switchRule();
  };

  useKey((e) => {
    if (e.key === "ArrowLeft") answer(0);
    if (e.key === "ArrowRight") answer(1);
  });

  const rule = RULES[ruleIdx];

  return (
    <div className="relative space-y-4">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="timer" label={`${timeLeft}s`} tone={timeLeft <= 5 ? "text-bad" : "text-gold"} />
        <HudChip icon="check" label={`${hits}/${tries}`} tone="text-good" />
      </div>
      <div
        className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-center text-sm font-black uppercase tracking-wider transition-colors sm:text-base ${
          ruleFlash ? "border-gold bg-gold/15 text-gold anim-pop" : "border-acc/40 bg-acc/10 text-acc"
        }`}
        aria-live="polite"
      >
        {t(rule.dim)}
      </div>
      <div className={`flex items-center justify-center rounded-xl border border-line bg-surface py-10 ${flash === "bad" ? "anim-shake" : ""}`}>
        <span key={num} className="tabular anim-pop font-mono text-7xl font-black sm:text-8xl" dir="ltr">
          {num}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {rule.opts.map((opt, i) => (
          <button
            key={rule.dim + opt}
            onClick={() => answer(i)}
            disabled={paused}
            className="btn-press min-h-[64px] rounded-xl bg-acc px-3 text-base font-black text-white sm:text-lg"
          >
            {t(opt)}
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-mut">
        <Kbd>←</Kbd> / <Kbd>→</Kbd>
      </p>
    </div>
  );
}

// keep strOptions import referenced for future variants
void strOptions;
