import { useEffect, useRef, useState } from "react";
import { mulberry32, shuffle } from "../core/engine";
import { HudChip, useCountdown, useKey, type GameProps } from "./shared";

const WORDS = ["BRAIN", "LOGIC", "FOCUS", "SPEED", "SMART", "QUICK", "THINK", "LEARN"];

export function WordSearch({ paused, t, fx, onScore, onFinish }: GameProps) {
  const SIZE = 10;
  const DURATION = 120;
  const [words] = useState(() => WORDS.slice(0, 6));
  const [grid, setGrid] = useState<string[][]>(() => genGrid(SIZE, WORDS.slice(0, 6)));
  const [found, setFound] = useState<string[]>([]);
  const [selecting, setSelecting] = useState(false);
  const [start, setStart] = useState<{ r: number; c: number } | null>(null);
  const [end, setEnd] = useState<{ r: number; c: number } | null>(null);
  const [score, setScore] = useState(0);
  const done = useRef(false);

  function genGrid(size: number, words: string[]): string[][] {
    const rng = mulberry32(Date.now() % 100000);
    const g: string[][] = Array.from({ length: size }, () => Array(size).fill(""));
    // place words
    for (const word of words) {
      let placed = false;
      for (let attempt = 0; attempt < 50 && !placed; attempt++) {
        const dir = rng() < 0.5 ? "h" : "v";
        const r = Math.floor(rng() * size);
        const c = Math.floor(rng() * size);
        if (dir === "h" && c + word.length <= size) {
          let ok = true;
          for (let i = 0; i < word.length; i++) {
            if (g[r][c + i] !== "" && g[r][c + i] !== word[i]) { ok = false; break; }
          }
          if (ok) {
            for (let i = 0; i < word.length; i++) g[r][c + i] = word[i];
            placed = true;
          }
        } else if (dir === "v" && r + word.length <= size) {
          let ok = true;
          for (let i = 0; i < word.length; i++) {
            if (g[r + i][c] !== "" && g[r + i][c] !== word[i]) { ok = false; break; }
          }
          if (ok) {
            for (let i = 0; i < word.length; i++) g[r + i][c] = word[i];
            placed = true;
          }
        }
      }
    }
    // fill empty
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (g[r][c] === "") g[r][c] = letters[Math.floor(rng() * letters.length)];
      }
    }
    return g;
  }

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onFinish({ score: Math.max(0, score), correct: found.length, total: words.length, duration: DURATION * 1000 });
  };
  const timeLeft = useCountdown(DURATION, paused, finish);

  const getSelected = (): { r: number; c: number }[] => {
    if (!start || !end) return [];
    const cells: { r: number; c: number }[] = [];
    const dr = Math.sign(end.r - start.r);
    const dc = Math.sign(end.c - start.c);
    let r = start.r, c = start.c;
    while (true) {
      cells.push({ r, c });
      if (r === end.r && c === end.c) break;
      r += dr;
      c += dc;
    }
    return cells;
  };

  const checkWord = () => {
    const cells = getSelected();
    if (cells.length === 0) return;
    const word = cells.map(({ r, c }) => grid[r][c]).join("");
    const rev = word.split("").reverse().join("");
    if (words.includes(word) && !found.includes(word)) {
      fx("good");
      setFound((f) => [...f, word]);
      setScore((s) => {
        const ns = s + 150;
        onScore(ns, 0);
        return ns;
      });
      if (found.length + 1 === words.length) {
        done.current = true;
        window.setTimeout(() => {
          onFinish({ score: score + 150, correct: words.length, total: words.length, duration: (DURATION - timeLeft) * 1000 });
        }, 400);
      }
    } else if (words.includes(rev) && !found.includes(rev)) {
      fx("good");
      setFound((f) => [...f, rev]);
      setScore((s) => {
        const ns = s + 150;
        onScore(ns, 0);
        return ns;
      });
    } else {
      fx("bad");
    }
    setSelecting(false);
    setStart(null);
    setEnd(null);
  };

  const isSelected = (r: number, c: number) => {
    if (!selecting || !start || !end) return false;
    const cells = getSelected();
    return cells.some(({ r: cr, c: cc }) => cr === r && cc === c);
  };

  const isFound = (r: number, c: number) => {
    // simple check: is this cell part of any found word?
    return false; // skip for now
  };

  useKey((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selecting) checkWord();
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="timer" label={`${timeLeft}s`} tone={timeLeft <= 10 ? "text-bad" : "text-gold"} />
        <HudChip icon="check" label={t("game.word-search.found", { n: found.length, total: words.length })} tone="text-good" />
      </div>
      <div className="flex items-center justify-center rounded-xl border border-line bg-surface p-3">
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}>
          {grid.map((row, r) =>
            row.map((ch, c) => (
              <button
                key={`${r}-${c}`}
                onMouseDown={() => {
                  setSelecting(true);
                  setStart({ r, c });
                  setEnd({ r, c });
                }}
                onMouseEnter={() => {
                  if (selecting) setEnd({ r, c });
                }}
                onMouseUp={() => {
                  if (selecting) checkWord();
                }}
                className={`grid size-7 place-items-center rounded text-xs font-black transition-all sm:size-8 sm:text-sm ${
                  isSelected(r, c) ? "bg-acc text-white scale-110" : isFound(r, c) ? "bg-good/20 text-good" : "bg-raise hover:bg-acc/10"
                }`}
              >
                {ch}
              </button>
            ))
          )}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {words.map((w) => (
          <span key={w} className={`rounded-md px-2 py-1 text-xs font-black ${found.includes(w) ? "bg-good/15 text-good line-through" : "bg-raise text-mut"}`}>
            {w}
          </span>
        ))}
      </div>
      <p className="text-center text-xs text-mut">{t("game.word-search.keys")}</p>
    </div>
  );
}
