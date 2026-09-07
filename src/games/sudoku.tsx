import { useEffect, useRef, useState } from "react";
import { mulberry32 } from "../core/engine";
import { HudChip, useKey, type GameProps } from "./shared";
import { Button } from "../components/ui";
import { Icon } from "../components/icons";

// Simplified Sudoku: 4x4 for now (easier to implement quickly)
const SIZE = 4;

function genSudoku(): number[][] {
  const rng = mulberry32(Date.now() % 100000);
  const solution: number[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  // simple backtracking generator
  function isValid(board: number[][], r: number, c: number, n: number): boolean {
    for (let i = 0; i < SIZE; i++) {
      if (board[r][i] === n || board[i][c] === n) return false;
    }
    const br = Math.floor(r / 2) * 2;
    const bc = Math.floor(c / 2) * 2;
    for (let dr = 0; dr < 2; dr++) {
      for (let dc = 0; dc < 2; dc++) {
        if (board[br + dr][bc + dc] === n) return false;
      }
    }
    return true;
  }
  function solve(board: number[][]): boolean {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === 0) {
          const nums = [1, 2, 3, 4].sort(() => rng() - 0.5);
          for (const n of nums) {
            if (isValid(board, r, c, n)) {
              board[r][c] = n;
              if (solve(board)) return true;
              board[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }
  solve(solution);
  // remove some cells
  const puzzle = solution.map((row) => [...row]);
  for (let i = 0; i < 8; i++) {
    const r = Math.floor(rng() * SIZE);
    const c = Math.floor(rng() * SIZE);
    puzzle[r][c] = 0;
  }
  return puzzle;
}

export function Sudoku({ paused, t, fx, onScore, onFinish }: GameProps) {
  const [puzzle] = useState(() => genSudoku());
  const [grid, setGrid] = useState<number[][]>(() => puzzle.map((row) => [...row]));
  const [pos, setPos] = useState<{ r: number; c: number } | null>(null);
  const [notes, setNotes] = useState(false);
  const [notesGrid, setNotesGrid] = useState<Set<string>[][]>(() =>
    Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => new Set()))
  );
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const done = useRef(false);

  const isOriginal = (r: number, c: number) => puzzle[r][c] !== 0;

  const setCell = (r: number, c: number, v: number) => {
    if (paused || done.current || isOriginal(r, c)) return;
    const ng = grid.map((row) => [...row]);
    ng[r][c] = v;
    setGrid(ng);
    setMoves((m) => m + 1);
    fx("click");
    // check if complete
    const complete = ng.every((row) => row.every((v) => v > 0));
    if (complete) {
      // validate
      let valid = true;
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          if (!isValid(ng, r, c, ng[r][c])) {
            valid = false;
            break;
          }
        }
        if (!valid) break;
      }
      if (valid) {
        done.current = true;
        const finalScore = Math.max(100, 1000 - moves * 5);
        setScore(finalScore);
        onScore(finalScore, 0);
        fx("win");
        window.setTimeout(() => {
          onFinish({ score: finalScore, correct: 1, total: 1, duration: moves * 1000 });
        }, 600);
      }
    }
  };

  function isValid(board: number[][], r: number, c: number, n: number): boolean {
    for (let i = 0; i < SIZE; i++) {
      if (i !== c && board[r][i] === n) return false;
      if (i !== r && board[i][c] === n) return false;
    }
    const br = Math.floor(r / 2) * 2;
    const bc = Math.floor(c / 2) * 2;
    for (let dr = 0; dr < 2; dr++) {
      for (let dc = 0; dc < 2; dc++) {
        if (br + dr !== r || bc + dc !== c) {
          if (board[br + dr][bc + dc] === n) return false;
        }
      }
    }
    return true;
  }

  const toggleNote = (r: number, c: number, n: number) => {
    if (isOriginal(r, c)) return;
    const ng = notesGrid.map((row) => row.map((s) => new Set(s)));
    if (ng[r][c].has(n.toString())) ng[r][c].delete(n.toString());
    else ng[r][c].add(n.toString());
    setNotesGrid(ng);
  };

  useKey((e) => {
    if (!pos) return;
    if (e.key === "ArrowUp") { e.preventDefault(); setPos({ r: Math.max(0, pos.r - 1), c: pos.c }); }
    if (e.key === "ArrowDown") { e.preventDefault(); setPos({ r: Math.min(SIZE - 1, pos.r + 1), c: pos.c }); }
    if (e.key === "ArrowLeft") { e.preventDefault(); setPos({ r: pos.r, c: Math.max(0, pos.c - 1) }); }
    if (e.key === "ArrowRight") { e.preventDefault(); setPos({ r: pos.r, c: Math.min(SIZE - 1, pos.c + 1) }); }
    if (e.key === "n" || e.key === "N") {
      setNotes((n) => !n);
    }
    const num = Number(e.key);
    if (num >= 1 && num <= SIZE && pos) {
      if (notes) toggleNote(pos.r, pos.c, num);
      else setCell(pos.r, pos.c, num);
    }
    if ((e.key === "0" || e.key === "Backspace") && pos) {
      setCell(pos.r, pos.c, 0);
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <HudChip icon="star" label={`${score}`} tone="text-acc" />
        <HudChip icon="refresh" label={`${moves} moves`} />
        {notes && <HudChip icon="wand" label={t("game.sudoku.notes")} tone="text-gold" />}
      </div>
      <div className="flex items-center justify-center rounded-xl border border-line bg-surface p-4">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}>
          {grid.map((row, r) =>
            row.map((v, c) => {
              const isPos = pos?.r === r && pos?.c === c;
              const isOrig = isOriginal(r, c);
              const hasConflict = v > 0 && !isValid(grid, r, c, v);
              const notes = notesGrid[r][c];
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => setPos({ r, c })}
                  className={`relative grid size-10 sm:size-12 md:size-14 place-items-center rounded border-2 text-lg sm:text-xl font-black transition-all ${
                    isPos ? "border-acc bg-acc/10" : hasConflict ? "border-bad bg-bad/10" : "border-line bg-surface hover:border-acc/50"
                  } ${isOrig ? "text-ink" : "text-acc"}`}
                >
                  {v > 0 ? v : notes.size > 0 && (
                    <div className="grid grid-cols-2 gap-0.5 text-[8px] font-bold text-mut">
                      {Array.from(notes).map((n) => (
                        <span key={n}>{n}</span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => {
              if (pos) {
                if (notes) toggleNote(pos.r, pos.c, n);
                else setCell(pos.r, pos.c, n);
              }
            }}
            disabled={paused}
            className="btn-soft-press min-h-[48px] rounded-lg border border-line bg-surface text-xl font-black hover:border-acc"
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => setNotes((n) => !n)}
          className={`btn-soft-press min-h-[48px] rounded-lg border text-sm font-black ${notes ? "border-gold bg-gold/10 text-gold" : "border-line bg-surface hover:border-acc"}`}
        >
          <Icon name="wand" size={16} />
        </button>
      </div>
      <p className="text-center text-xs text-mut">{t("game.sudoku.keys")}</p>
    </div>
  );
}
