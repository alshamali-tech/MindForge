import { useEffect, useRef, useState } from "react";
import { mulberry32, randInt, shuffle } from "../core/engine";
import { HudChip, useCountdown, useKey, type GameProps } from "./shared";

/* ================= SPEED FIND ================= */

const SYMBOLS = ["▲", "●", "■", "◆", "★", "⬢"];

export function SpeedFind({ paused, t, fx, onScore, onFinish }: GameProps) {
  const DURATION = 30;
  const [target, setTarget] = useState(SYMBOLS[0]);
  const [grid, setGrid] = useState<string[]>([]);
  const [oddIdx, setOddIdx] = useState(-1);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [tries, setTries] = useState(0);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const done = useRef(false);

  const genRound = () => {
    const rng = mulberry32(Date.now() % 100000);
    const t = SYMBOLS[randInt(rng, 0, SYMBOLS.length - 1)];
    let diff = t;
    while (diff === t) diff = SYMBOLS[randInt(rng, 0, SYMBOLS.length - 1)];
    const size = 25;
    const oi = randInt(rng, 0, size - 1);
    const g: string[] = [];
    for (let i = 0; i < size; i++) g.push(i === oi ? diff : t);
    setTarget(t);
    setGrid(g);
    setOddIdx(oi);
  };

  useEffect(() => genRound(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onFinish({ score: Math.max(0, score), correct: hits, total: tries, duration: DURATION * 1000 });
  };
  const timeLeft = useCountdown(DURATION, paused, finish);

  const tap = (i: number) => {
    if (paused || done.current || timeLeft <= 0 || flash) return;
    setTries((v) => v + 1);
    if (i === oddIdx) {
      fx("good");
      setHits((h) => h + 1);
      setScore((s) => {
        const ns = s + 80;
        onScore(ns, 0);
        return ns;
      });
      setFlash("good");
    } else {
      fx("bad");
      setScore((s) => {
        const ns = Math.max(0, s - 30);
        onScore(ns, 0);
        return ns;
      });
      setFlash("bad");
    }
    window.setTimeout(() => {
      setFlash(null);
      genRound();
    }, 250);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="timer" label={`${timeLeft}s`} tone={timeLeft <= 5 ? "text-bad" : "text-gold"} />
        <HudChip icon="check" label={`${hits}/${tries}`} tone="text-good" />
      </div>
      <div className="flex items-center justify-center gap-3 rounded-xl border border-line bg-surface py-4">
        <span className="text-xs font-black uppercase tracking-widest text-mut">Find:</span>
        <span className="text-4xl font-black text-acc">{target}</span>
        <span className="text-xs font-black uppercase tracking-widest text-mut">but look for the odd one</span>
      </div>
      <div className={`grid grid-cols-5 gap-2 rounded-xl border border-line bg-surface p-4 ${flash === "bad" ? "anim-shake" : ""}`}>
        {grid.map((s, i) => (
          <button
            key={i}
            onClick={() => tap(i)}
            disabled={paused}
            className="grid aspect-square place-items-center rounded-lg bg-raise text-2xl font-black text-mut transition-all hover:bg-acc/10 hover:text-acc"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================= DISTRACTION FILTER ================= */

const VOWELS = new Set(["A", "E", "I", "O", "U"]);

export function DistractionFilter({ paused, t, fx, onScore, onFinish }: GameProps) {
  const DURATION = 30;
  const [letter, setLetter] = useState("");
  const [isVowel, setIsVowel] = useState(false);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [tries, setTries] = useState(0);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const done = useRef(false);
  const responded = useRef(false);

  const genLetter = () => {
    const rng = mulberry32(Date.now() % 100000);
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const l = letters[randInt(rng, 0, letters.length - 1)];
    setLetter(l);
    setIsVowel(VOWELS.has(l));
    responded.current = false;
  };

  useEffect(() => {
    genLetter();
    const id = window.setInterval(() => {
      if (!paused && !done.current) genLetter();
    }, 1500);
    return () => window.clearInterval(id);
  }, [paused]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onFinish({ score: Math.max(0, score), correct: hits, total: tries, duration: DURATION * 1000 });
  };
  const timeLeft = useCountdown(DURATION, paused, finish);

  const respond = () => {
    if (paused || done.current || responded.current || timeLeft <= 0) return;
    responded.current = true;
    setTries((v) => v + 1);
    if (isVowel) {
      fx("good");
      setHits((h) => h + 1);
      setScore((s) => {
        const ns = s + 100;
        onScore(ns, 0);
        return ns;
      });
      setFlash("good");
    } else {
      fx("bad");
      setScore((s) => {
        const ns = Math.max(0, s - 50);
        onScore(ns, 0);
        return ns;
      });
      setFlash("bad");
    }
    window.setTimeout(() => setFlash(null), 300);
  };

  useKey((e) => {
    if (e.key === " ") {
      e.preventDefault();
      respond();
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="timer" label={`${timeLeft}s`} tone={timeLeft <= 5 ? "text-bad" : "text-gold"} />
        <HudChip icon="check" label={`${hits}/${tries}`} tone="text-good" />
      </div>
      <div className={`flex items-center justify-center rounded-xl border border-line bg-surface py-12 ${flash === "bad" ? "anim-shake" : ""}`}>
        <span key={letter} className="anim-pop text-8xl font-black text-acc" dir="ltr">{letter}</span>
      </div>
      <button onClick={respond} disabled={paused} className="btn-press w-full min-h-[56px] rounded-xl bg-acc text-lg font-black text-white">
        VOWEL? (Space)
      </button>
      <p className="text-center text-xs text-mut">Press only when the letter is a vowel (A, E, I, O, U)</p>
    </div>
  );
}

/* ================= VOCAB MATCH ================= */

const VOCAB = [
  { word: "Ephemeral", def: "Lasting for a very short time" },
  { word: "Ubiquitous", def: "Present everywhere" },
  { word: "Pragmatic", def: "Dealing with things sensibly and realistically" },
  { word: "Ambiguous", def: "Open to more than one interpretation" },
  { word: "Benevolent", def: "Well-meaning and kindly" },
  { word: "Candid", def: "Truthful and straightforward" },
  { word: "Diligent", def: "Having or showing care and conscientiousness" },
  { word: "Eloquent", def: "Fluent or persuasive in speaking or writing" },
  { word: "Frugal", def: "Sparing or economical with regard to money" },
  { word: "Gregarious", def: "Fond of company; sociable" },
];

export function VocabMatch({ paused, t, fx, onScore, onFinish }: GameProps) {
  const DURATION = 60;
  const [round, setRound] = useState(0);
  const [word, setWord] = useState(VOCAB[0].word);
  const [correctDef, setCorrectDef] = useState(VOCAB[0].def);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [tries, setTries] = useState(0);
  const [flash, setFlash] = useState<{ i: number; good: boolean } | null>(null);
  const done = useRef(false);

  const genRound = () => {
    const rng = mulberry32(Date.now() % 100000 + round);
    const idx = round % VOCAB.length;
    const w = VOCAB[idx];
    const defs = VOCAB.map((v) => v.def);
    const shuffled = shuffle(defs, rng).slice(0, 4);
    if (!shuffled.includes(w.def)) shuffled[0] = w.def;
    const finalShuffled = shuffle(shuffled, rng);
    setWord(w.word);
    setCorrectDef(w.def);
    setOptions(finalShuffled);
  };

  useEffect(() => genRound(), [round]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onFinish({ score: Math.max(0, score), correct: hits, total: tries, duration: DURATION * 1000 });
  };
  const timeLeft = useCountdown(DURATION, paused, finish);

  const answer = (i: number) => {
    if (paused || done.current || timeLeft <= 0 || flash) return;
    const right = options[i] === correctDef;
    setTries((v) => v + 1);
    setFlash({ i, good: right });
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
        const ns = Math.max(0, s - 40);
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
    const n = Number(e.key);
    if (n >= 1 && n <= 4) answer(n - 1);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="timer" label={`${timeLeft}s`} tone={timeLeft <= 10 ? "text-bad" : "text-gold"} />
        <HudChip icon="check" label={`${hits}/${tries}`} tone="text-good" />
      </div>
      <div className="flex items-center justify-center rounded-xl border border-line bg-surface py-8">
        <span key={word} className="anim-pop text-4xl font-black text-acc" dir="ltr">{word}</span>
      </div>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const isFlash = flash?.i === i;
          return (
            <button
              key={`${round}-${i}`}
              onClick={() => answer(i)}
              disabled={paused || !!flash}
              className={`relative w-full min-h-[56px] rounded-xl border-2 px-4 text-start text-sm font-bold transition-colors ${
                isFlash ? (flash!.good ? "border-good bg-good/15 text-good" : "border-bad bg-bad/10 text-bad anim-shake") : "border-line bg-surface hover:border-acc"
              }`}
            >
              <span className="absolute top-1 start-1.5 font-mono text-[10px] font-bold text-mut" dir="ltr">{i + 1}</span>
              <span className="ps-6">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ================= NUMBER GRID ================= */

export function NumberGrid({ paused, t, fx, onScore, onFinish }: GameProps) {
  const SIZE = 3;
  const TARGET = 15;
  const [grid, setGrid] = useState<number[][]>(() => Array(SIZE).fill(null).map(() => Array(SIZE).fill(0)));
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const done = useRef(false);

  const setCell = (r: number, c: number, v: number) => {
    if (paused || done.current) return;
    const ng = grid.map((row) => [...row]);
    ng[r][c] = v;
    setGrid(ng);
    setMoves((m) => m + 1);
    fx("click");
    // check if complete
    const complete = ng.every((row) => row.every((v) => v > 0));
    if (complete) {
      const rowsOk = ng.every((row) => row.reduce((a, b) => a + b, 0) === TARGET);
      const colsOk = Array.from({ length: SIZE }, (_, c) => ng.reduce((sum, row) => sum + row[c], 0) === TARGET).every((v) => v);
      if (rowsOk && colsOk) {
        done.current = true;
        const finalScore = Math.max(100, 1000 - moves * 10);
        setScore(finalScore);
        onScore(finalScore, 0);
        fx("win");
        window.setTimeout(() => {
          onFinish({ score: finalScore, correct: 1, total: 1, duration: moves * 1000 });
        }, 600);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="target" label={t("game.number-grid.target", { n: TARGET })} tone="text-acc" />
        <HudChip icon="refresh" label={`${moves} moves`} />
      </div>
      <div className="flex items-center justify-center rounded-xl border border-line bg-surface p-6">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}>
          {grid.map((row, r) =>
            row.map((v, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => setSelected({ r, c })}
                className={`grid size-14 sm:size-16 md:size-20 place-items-center rounded-lg border-2 text-xl sm:text-2xl font-black transition-all ${
                  selected?.r === r && selected?.c === c ? "border-acc bg-acc/10 text-acc" : "border-line bg-surface hover:border-acc/50"
                }`}
              >
                {v || "?"}
              </button>
            ))
          )}
        </div>
      </div>
      {selected && (
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
            <button
              key={n}
              onClick={() => {
                if (selected) {
                  setCell(selected.r, selected.c, n);
                  setSelected(null);
                }
              }}
              disabled={paused}
              className="btn-soft-press min-h-[48px] rounded-lg border border-line bg-surface text-xl font-black hover:border-acc"
            >
              {n || "⌫"}
            </button>
          ))}
        </div>
      )}
      <p className="text-center text-xs text-mut">Fill so each row and column sums to {TARGET}</p>
    </div>
  );
}
