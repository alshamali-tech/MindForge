import { useEffect, useRef, useState } from "react";
import { clamp, mulberry32, randInt, shuffle } from "../core/engine";
import { wordListFor } from "../core/words";
import { HudChip, numOptions, useCountdown, useEvery, useKey, type GameProps } from "./shared";
import { Icon } from "../components/icons";
import { Button } from "../components/ui";

/* ================= WORD SCRAMBLE ================= */

export function WordScramble({ paused, lang, t, fx, onScore, onFinish }: GameProps) {
  const DURATION = 90;
  const pool = wordListFor(lang).filter((w) => (lang === "ar" ? w.length >= 3 && w.length <= 6 : w.length >= 4 && w.length <= 7));

  const makeWord = () => {
    const word = pool[Math.floor(Math.random() * pool.length)];
    let tiles = word.split("");
    let guard = 0;
    do {
      tiles = shuffle(tiles, mulberry32(Date.now() % 99999 + guard++));
    } while (tiles.join("") === word && guard < 8);
    return { word, tiles };
  };

  const [round, setRound] = useState(makeWord);
  const [used, setUsed] = useState<boolean[]>(() => round.tiles.map(() => false));
  const [build, setBuild] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [rightFlash, setRightFlash] = useState(false);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onFinish({ score, correct: solved, total: attempts, duration: DURATION * 1000 });
  };
  const timeLeft = useCountdown(DURATION, paused, finish);

  const nextWord = () => {
    const nw = makeWord();
    setRound(nw);
    setBuild([]);
    setUsed(nw.tiles.map(() => false));
  };

  const addTile = (i: number) => {
    if (paused || done.current || used[i] || build.length >= round.word.length) return;
    fx("click");
    setUsed((u) => u.map((v, j) => (j === i ? true : v)));
    const nb = [...build, i];
    setBuild(nb);
    if (nb.length === round.word.length) {
      const attempt = nb.map((k) => round.tiles[k]).join("");
      setAttempts((a) => a + 1);
      if (attempt === round.word) {
        fx("good");
        setSolved((s) => s + 1);
        setRightFlash(true);
        const ns = score + round.word.length * 100 + 50;
        setScore(ns);
        onScore(ns, 0);
        window.setTimeout(() => {
          setRightFlash(false);
          nextWord();
        }, 650);
      } else {
        fx("bad");
        setWrongFlash(true);
        window.setTimeout(() => {
          setWrongFlash(false);
          setBuild([]);
          setUsed(round.tiles.map(() => false));
        }, 450);
      }
    }
  };

  const removeLast = () => {
    if (paused || build.length === 0 || rightFlash) return;
    const last = build[build.length - 1];
    setBuild((b) => b.slice(0, -1));
    setUsed((u) => u.map((v, j) => (j === last ? false : v)));
  };

  useKey((e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      removeLast();
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      const idx = round.tiles.findIndex((ch, i) => !used[i] && ch.toLowerCase() === e.key.toLowerCase());
      if (idx >= 0) addTile(idx);
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="timer" label={`${timeLeft}s`} tone={timeLeft <= 10 ? "text-bad" : "text-gold"} />
        <HudChip icon="check" label={`${solved} ✓`} tone="text-good" />
        <HudChip icon="star" label={`${round.word.length * 100 + 50} ${t("common.points")}`} tone="text-acc" />
      </div>

      <div
        className={`flex min-h-[84px] flex-wrap items-center justify-center gap-2 rounded-xl border-2 py-5 transition-colors ${
          rightFlash ? "border-good bg-good/10" : wrongFlash ? "border-bad bg-bad/10 anim-shake" : "border-line bg-surface"
        }`}
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        {round.word.split("").map((_, i) => {
          const tileIdx = build[i];
          return (
            <button
              key={i}
              onClick={() => {
                if (tileIdx === undefined || rightFlash) return;
                setBuild((b) => b.filter((x) => x !== tileIdx));
                setUsed((u) => u.map((v, j) => (j === tileIdx ? false : v)));
              }}
              aria-label={tileIdx !== undefined ? round.tiles[tileIdx] : "empty slot"}
              className={`grid size-11 place-items-center rounded-lg border-2 text-xl font-black transition-all sm:size-12 ${
                tileIdx !== undefined
                  ? rightFlash
                    ? "border-good bg-good text-white"
                    : "border-acc bg-acc/10 text-acc"
                  : "border-dashed border-line bg-raise/50"
              }`}
            >
              {tileIdx !== undefined ? round.tiles[tileIdx] : ""}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2" dir={lang === "ar" ? "rtl" : "ltr"}>
        {round.tiles.map((ch, i) => (
          <button
            key={i}
            onClick={() => addTile(i)}
            disabled={used[i] || paused}
            aria-label={ch}
            className={`btn-soft-press grid size-12 place-items-center rounded-xl border-2 text-xl font-black transition-all sm:size-14 sm:text-2xl ${
              used[i] ? "border-line bg-raise text-mut/30" : "border-line bg-surface hover:border-acc hover:text-acc"
            }`}
          >
            {ch}
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-2">
        <Button variant="soft" size="sm" onClick={removeLast} disabled={build.length === 0}>
          <Icon name="back" size={15} className="rtl-flip" /> {t("gameui.clear")}
        </Button>
      </div>
    </div>
  );
}

/* ================= MENTAL MATH ================= */

function genMath(streak: number) {
  const rng = mulberry32(Date.now() % 1000000 + streak * 31);
  let a = 0;
  let b = 0;
  let op = "+";
  if (streak < 3) {
    a = randInt(rng, 2, 19);
    b = randInt(rng, 2, 19);
    op = "+";
  } else if (streak < 6) {
    if (rng() < 0.5) {
      a = randInt(rng, 10, 60);
      b = randInt(rng, 2, a - 2);
      op = "−";
    } else {
      a = randInt(rng, 11, 49);
      b = randInt(rng, 11, 49);
      op = "+";
    }
  } else {
    const r = rng();
    if (r < 0.5) {
      a = randInt(rng, 3, 12);
      b = randInt(rng, 3, 12);
      op = "×";
    } else if (r < 0.75) {
      a = randInt(rng, 30, 99);
      b = randInt(rng, 11, a - 5);
      op = "−";
    } else {
      a = randInt(rng, 25, 89);
      b = randInt(rng, 25, 89);
      op = "+";
    }
  }
  const answer = op === "+" ? a + b : op === "−" ? a - b : a * b;
  const spread = op === "×" ? 12 : 8;
  const { opts, correct } = numOptions(answer, rng, spread);
  return { text: `${a} ${op} ${b}`, opts, correct };
}

export function MentalMath({ paused, t, fx, onScore, onFinish }: GameProps) {
  const DURATION = 60;
  const [q, setQ] = useState(() => genMath(0));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hits, setHits] = useState(0);
  const [tries, setTries] = useState(0);
  const [flash, setFlash] = useState<{ i: number; good: boolean } | null>(null);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onFinish({ score: Math.max(0, score), correct: hits, total: tries, duration: DURATION * 1000 });
  };
  const timeLeft = useCountdown(DURATION, paused, finish);

  const answer = (i: number) => {
    if (paused || done.current || timeLeft <= 0 || flash) return;
    const right = i === q.correct;
    setTries((v) => v + 1);
    setFlash({ i, good: right });
    if (right) {
      const mult = Math.min(3, 1 + Math.floor(streak / 4));
      fx("good");
      setHits((h) => h + 1);
      setStreak((s) => s + 1);
      const ns = score + 100 * mult;
      setScore(ns);
      onScore(ns, streak + 1);
    } else {
      fx("bad");
      setStreak(0);
      const ns = Math.max(0, score - 40);
      setScore(ns);
      onScore(ns, 0);
    }
    window.setTimeout(() => {
      setFlash(null);
      setQ(genMath(streak + (right ? 1 : 0)));
    }, 260);
  };

  useKey((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= 4) answer(n - 1);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="timer" label={`${timeLeft}s`} tone={timeLeft <= 10 ? "text-bad" : "text-gold"} />
        <HudChip icon="check" label={`${hits}/${tries}`} tone="text-good" />
        <HudChip icon="sparkles" label={`${t("gameui.level")} ${Math.min(3, 1 + Math.floor(streak / 3))}`} tone="text-acc" />
        {streak >= 4 && <HudChip icon="zap" label={`×${Math.min(3, 1 + Math.floor(streak / 4))}`} tone="text-acc" />}
      </div>
      <div className="flex items-center justify-center rounded-xl border border-line bg-surface py-9">
        <span key={q.text} className="tabular anim-pop font-mono text-5xl font-black tracking-tight sm:text-6xl" dir="ltr">
          {q.text} = ?
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {q.opts.map((o, i) => {
          const isFlash = flash?.i === i;
          return (
            <button
              key={`${q.text}-${i}`}
              onClick={() => answer(i)}
              disabled={paused || !!flash}
              className={`btn-soft-press relative min-h-[60px] rounded-xl border-2 font-mono text-2xl font-black transition-colors ${
                isFlash ? (flash!.good ? "border-good bg-good/15 text-good" : "border-bad bg-bad/10 text-bad anim-shake") : "border-line bg-surface hover:border-acc"
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

/* ================= NUMBER SEQUENCE ================= */

function genSeries(round: number) {
  const rng = mulberry32(Date.now() % 1000000 + round * 104729);
  const kinds = ["add", "sub", "mul", "grow", "alt", "fib", "grow", "mul"];
  const kind = kinds[round % kinds.length];
  let seq: number[] = [];
  switch (kind) {
    case "add": {
      const s = randInt(rng, 1, 20);
      const d = randInt(rng, 3, 12);
      seq = [s, s + d, s + 2 * d, s + 3 * d, s + 4 * d];
      break;
    }
    case "sub": {
      const s = randInt(rng, 60, 99);
      const d = randInt(rng, 4, 11);
      seq = [s, s - d, s - 2 * d, s - 3 * d, s - 4 * d];
      break;
    }
    case "mul": {
      const s = randInt(rng, 1, 3);
      const r = rng() < 0.6 ? 2 : 3;
      seq = [s, s * r, s * r ** 2, s * r ** 3, s * r ** 4];
      break;
    }
    case "grow": {
      const s = randInt(rng, 1, 10);
      const d = randInt(rng, 2, 6);
      seq = [s, s + d, s + 2 * d + 1, s + 3 * d + 3, s + 4 * d + 6];
      break;
    }
    case "alt": {
      const s = randInt(rng, 1, 9);
      const a = randInt(rng, 2, 7);
      const b = randInt(rng, 8, 14);
      seq = [s, s + a, s + a + b, s + 2 * a + b, s + 2 * a + 2 * b];
      break;
    }
    case "fib": {
      const a = randInt(rng, 1, 5);
      const b = randInt(rng, 2, 7);
      seq = [a, b, a + b, a + 2 * b, 2 * a + 3 * b];
      break;
    }
  }
  const answer = seq[4];
  const { opts, correct } = numOptions(answer, rng, kind === "mul" ? 12 : 7);
  return { display: seq.slice(0, 4), opts, correct };
}

export function NumberSequence({ paused, t, fx, onScore, onFinish }: GameProps) {
  const ROUNDS = 8;
  const [round, setRound] = useState(0);
  const [puzzle, setPuzzle] = useState(() => genSeries(0));
  const [phase, setPhase] = useState<"answer" | "reveal">("answer");
  const [picked, setPicked] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(12);
  const [score, setScore] = useState(0);
  const [correctN, setCorrectN] = useState(0);
  const done = useRef(false);
  const ticksRef = useRef(0);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  scoreRef.current = score;
  correctRef.current = correctN;

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
      fx("good");
      setCorrectN((c) => c + 1);
      const ns = score + 100 + timeLeft * 8;
      setScore(ns);
      onScore(ns, 0);
    } else {
      fx("bad");
    }
    window.setTimeout(() => {
      if (round + 1 >= ROUNDS) {
        if (!done.current) {
          done.current = true;
          onFinish({ score: scoreRef.current, correct: correctRef.current, total: ROUNDS, duration: ticksRef.current * 1000 });
        }
      } else {
        const nr = round + 1;
        setRound(nr);
        setPuzzle(genSeries(nr));
        setPhase("answer");
        setPicked(null);
      }
    }, 900);
  };

  useEffect(() => {
    if (timeLeft <= 0 && phase === "answer") resolve(null);
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  useKey((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= 4) resolve(n - 1);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <HudChip icon="flag" label={`${t("common.round")} ${round + 1}/${ROUNDS}`} />
        <HudChip icon="timer" label={`${timeLeft}s`} tone={timeLeft <= 3 ? "text-bad" : "text-gold"} />
        <HudChip icon="check" label={`${correctN}`} tone="text-good" />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-7 sm:gap-3" dir="ltr">
        {puzzle.display.map((n, i) => (
          <span key={i} className="tabular grid size-12 place-items-center rounded-lg bg-raise font-mono text-xl font-black sm:size-14 sm:text-2xl">
            {n}
          </span>
        ))}
        <span className="grid size-12 place-items-center rounded-lg border-2 border-dashed border-clanguage font-mono text-2xl font-black text-clanguage anim-glow sm:size-14">
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
      <p className="text-center text-xs text-mut">{clamp(1, 1, 1) === 1 ? "" : ""}</p>
    </div>
  );
}
