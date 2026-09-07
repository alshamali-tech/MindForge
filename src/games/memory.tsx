import { useEffect, useMemo, useRef, useState } from "react";
import { mulberry32, shuffle, clamp } from "../core/engine";
import { HudChip, useCountdown, useEvery, useKey, type GameProps } from "./shared";
import { Icon } from "../components/icons";

/* ================= CARD MATCH ================= */

const MATCH_SYMS = ["▲", "●", "■", "◆", "★", "⬢", "✚", "☾"];

interface MCard {
  sym: string;
  up: boolean;
  matched: boolean;
}

export function CardMatch({ paused, t, fx, onScore, onFinish }: GameProps) {
  const [cards, setCards] = useState<MCard[]>(() => {
    const rng = mulberry32(Date.now() % 100000);
    return shuffle([...MATCH_SYMS, ...MATCH_SYMS], rng).map((sym) => ({ sym, up: false, matched: false }));
  });
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(0);
  const [ticks, setTicks] = useState(0);
  const done = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const liveScore = clamp(1400 - moves * 30 - ticks * 2, 120, 1400);
  useEffect(() => {
    if (!done.current) onScore(liveScore, 0);
  }, [liveScore, onScore]);

  useEvery(1000, !paused && !done.current, () => setTicks((v) => v + 1));

  const flip = (i: number) => {
    if (paused || done.current) return;
    if (flipped.length === 2 || cards[i].up) return;
    fx("flip");
    const next = cards.map((c, j) => (j === i ? { ...c, up: true } : c));
    const nf = [...flipped, i];
    setCards(next);
    setFlipped(nf);
    if (nf.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = nf;
      window.setTimeout(() => {
        setCards((cs) => {
          if (cs[a].sym === cs[b].sym) {
            const upd = cs.map((c, j) => (j === a || j === b ? { ...c, matched: true } : c));
            setSolved((s) => {
              const ns = s + 1;
              if (ns === 8 && !done.current) {
                done.current = true;
                const score = clamp(1400 - (moves + 1) * 30 - ticks * 2, 120, 1400);
                window.setTimeout(() => onFinish({ score, correct: 8, total: moves + 1, duration: ticks * 1000 }), 500);
              }
              return ns;
            });
            return upd;
          }
          return cs.map((c, j) => (j === a || j === b ? { ...c, up: false } : c));
        });
        setFlipped([]);
      }, 620);
    }
  };

  // arrow-key navigation across the grid
  const onGridKey = (e: React.KeyboardEvent) => {
    const el = document.activeElement as HTMLElement | null;
    const idx = Number(el?.dataset.idx ?? -1);
    if (idx < 0) return;
    const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 4, ArrowUp: -4 };
    const d = map[e.key];
    if (d === undefined) return;
    e.preventDefault();
    const ni = clamp(idx + d, 0, 15);
    gridRef.current?.querySelector<HTMLElement>(`[data-idx="${ni}"]`)?.focus();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="clock" label={`${t("common.time")}: ${ticks}s`} />
        <HudChip icon="refresh" label={`${t("common.moves")}: ${moves}`} />
        <HudChip icon="check" label={`${solved}/8`} tone="text-good" />
      </div>
      <div ref={gridRef} onKeyDown={onGridKey} className="grid grid-cols-4 gap-2 sm:gap-3" role="group" aria-label={t("game.card-match.name")}>
        {cards.map((c, i) => (
          <button
            key={i}
            data-idx={i}
            onClick={() => flip(i)}
            disabled={c.matched}
            aria-label={c.up ? c.sym : "?"}
            className="flip-scene aspect-square w-full"
          >
            <span className={`flip-inner block ${c.up || c.matched ? "on" : ""}`}>
              <span className="flip-face bg-raise border border-line hover:border-acc transition-colors">
                <Icon name="logo" size={22} className="text-mut opacity-50" />
              </span>
              <span className={`flip-face flip-front border text-2xl sm:text-3xl ${c.matched ? "border-good/60 bg-good/10 text-good" : "border-acc/50 bg-acc/10 text-acc"}`}>
                {c.sym}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================= SEQUENCE RECALL ================= */

const SIMON_TILES = [
  { sym: "▲", cls: "bg-cmemory", key: "1" },
  { sym: "●", cls: "bg-cfocus", key: "2" },
  { sym: "■", cls: "bg-cspeed", key: "3" },
  { sym: "◆", cls: "bg-clogic", key: "4" },
];

export function SequenceRecall({ paused, t, fx, onScore, onFinish }: GameProps) {
  const [seq, setSeq] = useState<number[]>(() => [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)]);
  const [lit, setLit] = useState<number | null>(null);
  const [phase, setPhase] = useState<"show" | "input" | "reveal">("show");
  const [showIdx, setShowIdx] = useState(0);
  const [inputIdx, setInputIdx] = useState(0);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const done = useRef(false);

  // playback
  useEvery(620, phase === "show" && !paused, () => {
    setShowIdx((i) => {
      if (i < seq.length) {
        setLit(seq[i]);
        fx("tick");
        window.setTimeout(() => setLit(null), 340);
      }
      if (i + 1 >= seq.length) {
        window.setTimeout(() => setPhase("input"), 380);
      }
      return i + 1;
    });
  });

  const press = (i: number) => {
    if (paused || phase !== "input" || done.current) return;
    if (i === seq[inputIdx]) {
      setLit(i);
      window.setTimeout(() => setLit(null), 240);
      fx("good");
      const ni = inputIdx + 1;
      if (ni === seq.length) {
        const ns = score + 40 + seq.length * 20;
        setScore(ns);
        onScore(ns, seq.length);
        setPhase("reveal");
        window.setTimeout(() => {
          setSeq((s) => [...s, Math.floor(Math.random() * 4)]);
          setLevel((l) => l + 1);
          setShowIdx(0);
          setInputIdx(0);
          setPhase("show");
        }, 650);
      } else {
        setInputIdx(ni);
      }
    } else {
      done.current = true;
      setWrong(i);
      fx("bad");
      window.setTimeout(() => {
        onFinish({ score, correct: level - 1, total: level, duration: level * 4000 });
      }, 900);
    }
  };

  useKey((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= 4) press(n - 1);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="sparkles" label={`${t("gameui.level")} ${level}`} />
        <HudChip icon="star" label={`${t("common.score")}: ${score}`} />
        <HudChip
          icon="info"
          label={phase === "show" ? "…" : phase === "input" ? `${inputIdx}/${seq.length}` : "✓"}
          tone={phase === "input" ? "text-acc" : "text-mut"}
        />
      </div>
      <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${wrong !== null ? "anim-shake" : ""}`} role="group" aria-label={t("game.sequence-recall.name")}>
        {SIMON_TILES.map((tile, i) => (
          <button
            key={i}
            onClick={() => press(i)}
            disabled={phase !== "input" || paused}
            aria-label={`${tile.sym} (${tile.key})`}
            className={`relative flex aspect-square items-center justify-center rounded-xl text-4xl text-white/90 transition-all duration-150 sm:text-5xl ${tile.cls} ${
              lit === i ? "anim-tile scale-[1.04] ring-4 ring-white/60" : "opacity-80"
            } ${wrong === i ? "ring-4 ring-bad" : ""} ${phase === "input" ? "hover:scale-[1.03] active:scale-95 cursor-pointer" : "cursor-default"}`}
          >
            {tile.sym}
            <span className="absolute bottom-2 end-2 rounded bg-black/25 px-1.5 font-mono text-xs font-bold">{tile.key}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================= OBJECT POSITION ================= */

const OBJ_SYMS = ["▲", "●", "■", "◆"];

export function ObjectPosition({ paused, t, fx, onScore, onFinish }: GameProps) {
  const TOTAL_ROUNDS = 6;
  const [round, setRound] = useState(0);
  const [placements, setPlacements] = useState<Map<string, number>>(new Map());
  const [phase, setPhase] = useState<"show" | "ask" | "reveal">("show");
  const [askSym, setAskSym] = useState("▲");
  const [answerLeft, setAnswerLeft] = useState(4);
  const [score, setScore] = useState(0);
  const [correctN, setCorrectN] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const done = useRef(false);
  const ticksRef = useRef(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const newRound = useMemo(
    () => () => {
      const cells = shuffle(Array.from({ length: 16 }, (_, i) => i), mulberry32(Date.now() % 99999 + round)).slice(0, 4);
      const map = new Map<string, number>();
      OBJ_SYMS.forEach((s, i) => map.set(s, cells[i]));
      setPlacements(map);
      setAskSym(OBJ_SYMS[Math.floor(Math.random() * 4)]);
      setPhase("show");
      setPicked(null);
      setAnswerLeft(4);
    },
    [round]
  );

  useEffect(() => {
    newRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  // show phase 2.4s
  const [showTicks, setShowTicks] = useState(0);
  useEffect(() => setShowTicks(0), [round]);
  useEvery(600, phase === "show" && !paused, () => {
    setShowTicks((v) => {
      if (v + 1 >= 4) setPhase("ask");
      return v + 1;
    });
  });

  // answer window
  useEvery(1000, phase === "ask" && !paused, () => {
    ticksRef.current += 1;
    setAnswerLeft((v) => Math.max(0, v - 1));
  });

  useEffect(() => {
    if (phase === "ask" && answerLeft <= 0) resolve(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answerLeft, phase]);

  const resolve = (cell: number | null) => {
    setPhase("reveal");
    setPicked(cell);
    const right = cell !== null && placements.get(askSym) === cell;
    if (right) {
      const gained = 150 + answerLeft * 25;
      const ns = score + gained;
      setScore(ns);
      onScore(ns, 0);
      setCorrectN((c) => c + 1);
      fx("good");
    } else {
      fx("bad");
    }
    window.setTimeout(() => {
      if (round + 1 >= TOTAL_ROUNDS) {
        if (!done.current) {
          done.current = true;
          onFinish({ score: scoreRef.current, correct: correctRef.current, total: TOTAL_ROUNDS, duration: (ticksRef.current + round * 5) * 1000 });
        }
      } else {
        setRound((r) => r + 1);
      }
    }, 1100);
  };

  // closures above capture stale score/correctN; compute via refs
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const correctRef = useRef(0);
  correctRef.current = correctN;

  const onGridKey = (e: React.KeyboardEvent) => {
    const el = document.activeElement as HTMLElement | null;
    const idx = Number(el?.dataset.idx ?? -1);
    if (idx < 0) return;
    const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 4, ArrowUp: -4 };
    const d = map[e.key];
    if (d === undefined) return;
    e.preventDefault();
    gridRef.current?.querySelector<HTMLElement>(`[data-idx="${clamp(idx + d, 0, 15)}"]`)?.focus();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <HudChip icon="flag" label={`${t("common.round")} ${Math.min(round + 1, TOTAL_ROUNDS)}/${TOTAL_ROUNDS}`} />
        <HudChip icon="star" label={`${t("common.score")}: ${score}`} />
        {phase === "ask" && <HudChip icon="timer" label={`${answerLeft}s`} tone="text-gold" />}
        <span className="ms-auto flex items-center gap-1.5 rounded-lg bg-acc/10 px-3 py-1.5 text-sm font-black text-acc">
          {t("game.object-position.where")} <span className="text-xl leading-none">{askSym}</span> ?
        </span>
      </div>
      <div ref={gridRef} onKeyDown={onGridKey} className="grid grid-cols-4 gap-2 sm:gap-3" role="group" aria-label={t("game.object-position.name")}>
        {Array.from({ length: 16 }, (_, i) => {
          const symHere = phase !== "ask" ? [...placements.entries()].find(([, c]) => c === i)?.[0] : undefined;
          const isAnswer = phase === "reveal" && placements.get(askSym) === i;
          const isWrongPick = phase === "reveal" && picked === i && !isAnswer;
          return (
            <button
              key={i}
              data-idx={i}
              onClick={() => phase === "ask" && !paused && resolve(i)}
              disabled={phase !== "ask"}
              aria-label={`cell ${i + 1}`}
              className={`flex aspect-square items-center justify-center rounded-xl border text-2xl sm:text-3xl transition-all duration-200 ${
                isAnswer
                  ? "border-good bg-good/15 text-good scale-[1.04]"
                  : isWrongPick
                    ? "border-bad bg-bad/15 text-bad anim-shake"
                    : symHere
                      ? "border-acc/50 bg-acc/10 text-acc anim-pop"
                      : "border-line bg-raise text-transparent hover:border-acc/60"
              }`}
            >
              {symHere ?? "•"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
