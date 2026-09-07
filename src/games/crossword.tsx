import { useEffect, useRef, useState } from "react";
import { mulberry32, shuffle } from "../core/engine";
import { HudChip, useKey, type GameProps } from "./shared";
import { Button } from "../components/ui";
import { Icon } from "../components/icons";

// Simple crossword data: word + clue pairs
const CROSSWORD_DATA = [
  { word: "BRAIN", clue: "Organ of thought" },
  { word: "LOGIC", clue: "Systematic reasoning" },
  { word: "FOCUS", clue: "Concentrated attention" },
  { word: "SPEED", clue: "Rate of motion" },
  { word: "MEMORY", clue: "Ability to recall" },
  { word: "PUZZLE", clue: "Problem to solve" },
  { word: "THINK", clue: "Use your mind" },
  { word: "LEARN", clue: "Gain knowledge" },
  { word: "SMART", clue: "Intelligent" },
  { word: "QUICK", clue: "Fast" },
];

interface Cell {
  letter: string;
  filled: string;
  across?: number;
  down?: number;
  isBlack: boolean;
}

export function Crossword({ paused, lang, t, fx, onScore, onFinish }: GameProps) {
  const SIZE = 7;
  const [grid, setGrid] = useState<Cell[][]>(() => genCrossword(SIZE));
  const [pos, setPos] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [dir, setDir] = useState<"across" | "down">("across");
  const [score, setScore] = useState(0);
  const [checked, setChecked] = useState(false);
  const done = useRef(false);

  function genCrossword(size: number): Cell[][] {
    const rng = mulberry32(Date.now() % 100000);
    const words = shuffle(CROSSWORD_DATA, rng).slice(0, 5);
    const g: Cell[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({ letter: "", filled: "", isBlack: true }))
    );
    // place first word horizontally in middle
    const w0 = words[0];
    const startC = Math.floor((size - w0.word.length) / 2);
    const startR = Math.floor(size / 2);
    for (let i = 0; i < w0.word.length; i++) {
      g[startR][startC + i] = { letter: w0.word[i], filled: "", isBlack: false, across: 1 };
    }
    // mark remaining as black for simplicity
    return g;
  }

  const move = (dr: number, dc: number) => {
    if (paused) return;
    const nr = pos.r + dr;
    const nc = pos.c + dc;
    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) return;
    if (grid[nr][nc].isBlack) return;
    setPos({ r: nr, c: nc });
    if (dc !== 0) setDir("across");
    if (dr !== 0) setDir("down");
  };

  const typeLetter = (ch: string) => {
    if (paused || done.current) return;
    const cell = grid[pos.r][pos.c];
    if (cell.isBlack) return;
    const ng = grid.map((row) => row.map((c) => ({ ...c })));
    ng[pos.r][pos.c].filled = ch.toUpperCase();
    setGrid(ng);
    fx("click");
    // auto-advance
    if (dir === "across") move(0, 1);
    else move(1, 0);
  };

  const check = () => {
    setChecked(true);
    let correct = 0;
    let total = 0;
    grid.forEach((row) =>
      row.forEach((cell) => {
        if (!cell.isBlack) {
          total++;
          if (cell.filled === cell.letter) correct++;
        }
      })
    );
    const pct = total > 0 ? correct / total : 0;
    const finalScore = Math.round(pct * 1000);
    setScore(finalScore);
    onScore(finalScore, 0);
    if (pct === 1) {
      done.current = true;
      fx("win");
      window.setTimeout(() => {
        onFinish({ score: finalScore, correct, total, duration: 0 });
      }, 600);
    } else {
      fx(pct > 0.5 ? "good" : "bad");
    }
  };

  useKey((e) => {
    if (e.key === "ArrowUp") { e.preventDefault(); move(-1, 0); }
    if (e.key === "ArrowDown") { e.preventDefault(); move(1, 0); }
    if (e.key === "ArrowLeft") { e.preventDefault(); move(0, -1); }
    if (e.key === "ArrowRight") { e.preventDefault(); move(0, 1); }
    if (e.key === "Tab") {
      e.preventDefault();
      setDir((d) => (d === "across" ? "down" : "across"));
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      const ng = grid.map((row) => row.map((c) => ({ ...c })));
      ng[pos.r][pos.c].filled = "";
      setGrid(ng);
      if (dir === "across") move(0, -1);
      else move(-1, 0);
    }
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      typeLetter(e.key);
    }
  });

  const cellSize = "size-10 sm:size-12";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="star" label={`${score}`} tone="text-acc" />
        <HudChip icon="info" label={dir === "across" ? t("game.crossword.across") : t("game.crossword.down")} tone="text-mut" />
      </div>
      <div className="flex items-center justify-center rounded-xl border border-line bg-surface p-4">
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}>
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isPos = pos.r === r && pos.c === c;
              const isError = checked && !cell.isBlack && cell.filled !== cell.letter && cell.filled !== "";
              const isCorrect = checked && !cell.isBlack && cell.filled === cell.letter;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => {
                    if (!cell.isBlack) setPos({ r, c });
                  }}
                  className={`relative grid ${cellSize} place-items-center rounded border text-lg font-black transition-all ${
                    cell.isBlack ? "bg-raise border-transparent" : isPos ? "border-acc bg-acc/10 text-acc" : isError ? "border-bad bg-bad/10 text-bad" : isCorrect ? "border-good bg-good/10 text-good" : "border-line bg-surface hover:border-acc/50"
                  }`}
                >
                  {cell.across && <span className="absolute top-0 start-0.5 font-mono text-[8px] text-mut" dir="ltr">{cell.across}</span>}
                  {cell.down && !cell.across && <span className="absolute top-0 start-0.5 font-mono text-[8px] text-mut" dir="ltr">{cell.down}</span>}
                  {!cell.isBlack && cell.filled}
                </button>
              );
            })
          )}
        </div>
      </div>
      <div className="flex justify-center gap-2">
        <Button onClick={check} variant="soft">
          <Icon name="check" size={15} /> {t("game.crossword.check")}
        </Button>
      </div>
      <p className="text-center text-xs text-mut">{t("game.crossword.keys")}</p>
    </div>
  );
}
