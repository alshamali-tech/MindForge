import { useState, useEffect } from 'react';
import { GameProps, useKey } from './shared';
import crosswordPuzzles from '../data/crossword-puzzles.json';

interface Cell {
  answer: string;
  filled: string;
  nums: number[];
  words: string[];
  isBlack: boolean;
}

interface Word {
  answer: string;
  row: number;
  col: number;
  dir: 'across' | 'down';
  num: number;
  clue: string;
  id: string;
  completed: boolean;
}

interface Puzzle {
  id: string;
  difficulty: string;
  rows: number;
  cols: number;
  words: Word[];
}

export function MiniCrossword({ onScore, onFinish, fx, paused }: GameProps) {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [activeCell, setActiveCell] = useState<{ r: number; c: number; dir: 'across' | 'down' } | null>(null);
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [message, setMessage] = useState('');
  const [gameComplete, setGameComplete] = useState(false);
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null);

  const puzzles = crosswordPuzzles.puzzles as Puzzle[];
  const currentPuzzle = puzzles[currentPuzzleIndex];

  useEffect(() => {
    if (currentPuzzle) {
      buildGrid(currentPuzzle);
    }
  }, [currentPuzzleIndex, currentPuzzle]);

  const buildGrid = (puzzle: Puzzle) => {
    // Initialize empty grid
    const newGrid: Cell[][] = Array.from({ length: puzzle.rows }, () =>
      Array.from({ length: puzzle.cols }, () => ({
        answer: '',
        filled: '',
        nums: [],
        words: [],
        isBlack: true,
      }))
    );

    // Place words
    const newWords: Word[] = puzzle.words.map((w, idx) => ({
      ...w,
      id: `word-${idx}`,
      completed: false,
    }));

    newWords.forEach((word) => {
      for (let i = 0; i < word.answer.length; i++) {
        const r = word.dir === 'across' ? word.row : word.row + i;
        const c = word.dir === 'across' ? word.col + i : word.col;

        if (r >= 0 && r < puzzle.rows && c >= 0 && c < puzzle.cols) {
          const cell = newGrid[r][c];
          cell.isBlack = false;
          cell.answer = word.answer[i];
          
          if (i === 0) {
            cell.nums.push(word.num);
          }
          
          cell.words.push(word.id);
        }
      }
    });

    setGrid(newGrid);
    setWords(newWords);
    setActiveCell(null);
    setHighlightedWord(null);
    setMessage('');
  };

  const handleCellClick = (r: number, c: number) => {
    if (paused || gameComplete) return;
    if (grid[r][c].isBlack) return;

    // If clicking the same cell, toggle direction
    if (activeCell && activeCell.r === r && activeCell.c === c) {
      const newDir = activeCell.dir === 'across' ? 'down' : 'across';
      setActiveCell({ ...activeCell, dir: newDir });
      
      // Find which word this direction belongs to
      const wordId = grid[r][c].words.find(wId => {
        const word = words.find(w => w.id === wId);
        return word && word.dir === newDir;
      });
      setHighlightedWord(wordId || null);
    } else {
      // New cell - determine default direction
      const cellWords = grid[r][c].words.map(wId => words.find(w => w.id === wId)).filter(Boolean) as Word[];
      const defaultDir = cellWords[0]?.dir || 'across';
      
      setActiveCell({ r, c, dir: defaultDir });
      setHighlightedWord(cellWords[0]?.id || null);
    }
  };

  const handleKeyPress = (key: string) => {
    if (!activeCell || paused || gameComplete) return;

    const { r, c, dir } = activeCell;
    const cell = grid[r][c];
    
    if (cell.isBlack) return;

    if (key === 'BACKSPACE') {
      // Clear current cell and move back
      const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
      if (newGrid[r][c].filled) {
        newGrid[r][c].filled = '';
        setGrid(newGrid);
      }
      
      // Move to previous cell in current direction
      const prevR = dir === 'down' ? r - 1 : r;
      const prevC = dir === 'across' ? c - 1 : c;
      
      if (prevR >= 0 && prevC >= 0 && !grid[prevR][prevC].isBlack) {
        setActiveCell({ r: prevR, c: prevC, dir });
      }
      return;
    }

    const letter = key.toUpperCase();
    if (!/^[A-Z]$/.test(letter)) return;

    if (letter === cell.answer) {
      // Correct!
      const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
      newGrid[r][c].filled = letter;
      setGrid(newGrid);
      
      fx('good');
      setMessage('Correct! ✓');
      
      // Check if word is complete
      const currentWordId = grid[r][c].words.find(wId => {
        const word = words.find(w => w.id === wId);
        return word && word.dir === dir;
      });
      
      if (currentWordId) {
        const word = words.find(w => w.id === currentWordId);
        if (word && isWordComplete(word, newGrid)) {
          const newWords = words.map(w => 
            w.id === currentWordId ? { ...w, completed: true } : w
          );
          setWords(newWords);
          setMessage(`✓ ${word.clue.split(' ')[0]} complete!`);
        }
      }
      
      // Check if puzzle is complete
      if (isPuzzleComplete(newGrid)) {
        handlePuzzleComplete();
      } else {
        // Auto-advance to next cell
        advanceToNextCell(r, c, dir, newGrid);
      }
    } else {
      // Wrong - shake animation
      fx('bad');
      setMessage('Not quite, try again');
      shakeCell(r, c);
    }
  };

  const advanceToNextCell = (r: number, c: number, dir: 'across' | 'down', currentGrid: Cell[][]) => {
    let nextR = dir === 'down' ? r + 1 : r;
    let nextC = dir === 'across' ? c + 1 : c;
    
    // Check if next cell is valid
    if (nextR < currentGrid.length && nextC < currentGrid[0].length && !currentGrid[nextR][nextC].isBlack && !currentGrid[nextR][nextC].filled) {
      setActiveCell({ r: nextR, c: nextC, dir });
      
      // Update highlighted word
      const wordId = currentGrid[nextR][nextC].words.find(wId => {
        const word = words.find(w => w.id === wId);
        return word && word.dir === dir;
      });
      setHighlightedWord(wordId || null);
    } else {
      // Find next unsolved cell
      for (let row = 0; row < currentGrid.length; row++) {
        for (let col = 0; col < currentGrid[0].length; col++) {
          if (!currentGrid[row][col].isBlack && !currentGrid[row][col].filled) {
            setActiveCell({ r: row, c: col, dir });
            const wordId = currentGrid[row][col].words.find(wId => {
              const word = words.find(w => w.id === wId);
              return word && word.dir === dir;
            });
            setHighlightedWord(wordId || null);
            return;
          }
        }
      }
    }
  };

  const isWordComplete = (word: Word, currentGrid: Cell[][]): boolean => {
    for (let i = 0; i < word.answer.length; i++) {
      const r = word.dir === 'across' ? word.row : word.row + i;
      const c = word.dir === 'across' ? word.col + i : word.col;
      if (currentGrid[r][c].filled !== word.answer[i]) {
        return false;
      }
    }
    return true;
  };

  const isPuzzleComplete = (currentGrid: Cell[][]): boolean => {
    return currentGrid.every(row => 
      row.every(cell => cell.isBlack || cell.filled === cell.answer)
    );
  };

  const handlePuzzleComplete = () => {
    const baseScore = 100;
    const hintPenalty = hintsUsed * 10;
    const puzzleScore = Math.max(20, baseScore - hintPenalty);
    
    const newScore = score + puzzleScore;
    setScore(newScore);
    onScore(puzzleScore, 0);
    
    fx('win');
    setMessage(`🎉 Puzzle complete! +${puzzleScore} points`);
    
    // Check if all puzzles complete
    if (currentPuzzleIndex >= puzzles.length - 1) {
      setGameComplete(true);
      setTimeout(() => {
        onFinish({
          score: newScore,
          correct: words.length,
          total: words.length,
          duration: 0,
        });
      }, 2000);
    } else {
      // Move to next puzzle after delay
      setTimeout(() => {
        setCurrentPuzzleIndex(prev => prev + 1);
      }, 2000);
    }
  };

  const revealLetter = () => {
    if (!activeCell || paused || gameComplete) return;
    
    const { r, c } = activeCell;
    const cell = grid[r][c];
    
    if (cell.isBlack || cell.filled === cell.answer) return;
    
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    newGrid[r][c].filled = cell.answer;
    setGrid(newGrid);
    setHintsUsed(prev => prev + 1);
    
    fx('good');
    setMessage('Letter revealed! (-10 points)');
    
    // Check if puzzle is complete
    if (isPuzzleComplete(newGrid)) {
      handlePuzzleComplete();
    }
  };

  const revealWord = () => {
    if (!activeCell || paused || gameComplete) return;
    
    const { r, c, dir } = activeCell;
    const wordId = grid[r][c].words.find(wId => {
      const word = words.find(w => w.id === wId);
      return word && word.dir === dir;
    });
    
    if (!wordId) return;
    
    const word = words.find(w => w.id === wordId);
    if (!word) return;
    
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    
    for (let i = 0; i < word.answer.length; i++) {
      const wr = word.dir === 'across' ? word.row : word.row + i;
      const wc = word.dir === 'across' ? word.col + i : word.col;
      newGrid[wr][wc].filled = word.answer[i];
    }
    
    setGrid(newGrid);
    setHintsUsed(prev => prev + 1);
    
    fx('good');
    setMessage('Word revealed! (-10 points)');
    
    // Check if puzzle is complete
    if (isPuzzleComplete(newGrid)) {
      handlePuzzleComplete();
    }
  };

  const shakeCell = (r: number, c: number) => {
    const cellElement = document.querySelector(`[data-cell="${r}-${c}"]`) as HTMLElement;
    if (cellElement) {
      cellElement.classList.add('anim-shake');
      setTimeout(() => {
        cellElement.classList.remove('anim-shake');
      }, 300);
    }
  };

  // Physical keyboard support
  useKey((e) => {
    if (paused || gameComplete) return;
    
    const key = e.key.toUpperCase();
    if (/^[A-Z]$/.test(key)) {
      e.preventDefault();
      handleKeyPress(key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      handleKeyPress('BACKSPACE');
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      handleArrowKey(e.key);
    }
  });

  const handleArrowKey = (key: string) => {
    if (!activeCell) return;
    
    let { r, c } = activeCell;
    
    if (key === 'ArrowUp' && r > 0 && !grid[r - 1][c].isBlack) {
      setActiveCell({ r: r - 1, c, dir: 'down' });
    } else if (key === 'ArrowDown' && r < grid.length - 1 && !grid[r + 1][c].isBlack) {
      setActiveCell({ r: r + 1, c, dir: 'down' });
    } else if (key === 'ArrowLeft' && c > 0 && !grid[r][c - 1].isBlack) {
      setActiveCell({ r, c: c - 1, dir: 'across' });
    } else if (key === 'ArrowRight' && c < grid[0].length - 1 && !grid[r][c + 1].isBlack) {
      setActiveCell({ r, c: c + 1, dir: 'across' });
    }
  };

  if (!currentPuzzle || grid.length === 0) {
    return <div>Loading...</div>;
  }

  const acrossClues = words.filter(w => w.dir === 'across').sort((a, b) => a.num - b.num);
  const downClues = words.filter(w => w.dir === 'down').sort((a, b) => a.num - b.num);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 max-w-6xl mx-auto">
      {/* Left side: Grid and controls */}
      <div className="flex flex-col items-center gap-4 flex-1">
        {/* Header */}
        <div className="w-full flex justify-between items-center text-sm">
          <div className="font-semibold">
            Puzzle {currentPuzzleIndex + 1}/{puzzles.length}
          </div>
          <div className="font-bold text-lg">Score: {score}</div>
        </div>

        {/* Message */}
        {message && (
          <div className="text-center text-lg font-semibold animate-fade-in">
            {message}
          </div>
        )}

        {/* Crossword Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <div 
            className="grid gap-0.5"
            style={{ 
              gridTemplateColumns: `repeat(${currentPuzzle.cols}, minmax(0, 1fr))`,
            }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => {
                if (cell.isBlack) {
                  return (
                    <div
                      key={`${r}-${c}`}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-800 dark:bg-gray-900"
                    />
                  );
                }

                const isActive = activeCell?.r === r && activeCell?.c === c;
                const isHighlighted = highlightedWord && cell.words.includes(highlightedWord);
                const isFilled = cell.filled !== '';

                return (
                  <button
                    key={`${r}-${c}`}
                    data-cell={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`
                      relative w-10 h-10 sm:w-12 sm:h-12 border-2 text-lg sm:text-xl font-bold
                      transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-200 dark:bg-blue-800 border-blue-500 dark:border-blue-400' 
                        : isHighlighted
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                      }
                    `}
                  >
                    {/* Number */}
                    {cell.nums.length > 0 && (
                      <span className="absolute top-0.5 left-0.5 text-[8px] sm:text-[10px] font-normal text-gray-600 dark:text-gray-400">
                        {cell.nums[0]}
                      </span>
                    )}
                    
                    {/* Letter */}
                    {isFilled && (
                      <span className={cell.filled === cell.answer ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}>
                        {cell.filled}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={revealLetter}
            disabled={gameComplete || !activeCell}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
          >
            👁 Reveal Letter
          </button>
          <button
            onClick={revealWord}
            disabled={gameComplete || !activeCell}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
          >
            📝 Reveal Word
          </button>
        </div>
      </div>

      {/* Right side: Clues */}
      <div className="flex flex-col gap-4 lg:w-80">
        {/* Across Clues */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <h3 className="font-bold text-lg mb-3 text-blue-600 dark:text-blue-400">→ Across</h3>
          <div className="space-y-2">
            {acrossClues.map((word) => (
              <div
                key={word.id}
                className={`text-sm cursor-pointer p-2 rounded transition-colors ${
                  highlightedWord === word.id 
                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                    : word.completed
                      ? 'line-through text-gray-500'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => {
                  setActiveCell({ r: word.row, c: word.col, dir: 'across' });
                  setHighlightedWord(word.id);
                }}
              >
                <span className="font-bold mr-2">{word.num}.</span>
                {word.clue}
                {word.completed && <span className="ml-2 text-green-600">✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Down Clues */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <h3 className="font-bold text-lg mb-3 text-green-600 dark:text-green-400">↓ Down</h3>
          <div className="space-y-2">
            {downClues.map((word) => (
              <div
                key={word.id}
                className={`text-sm cursor-pointer p-2 rounded transition-colors ${
                  highlightedWord === word.id 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : word.completed
                      ? 'line-through text-gray-500'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => {
                  setActiveCell({ r: word.row, c: word.col, dir: 'down' });
                  setHighlightedWord(word.id);
                }}
              >
                <span className="font-bold mr-2">{word.num}.</span>
                {word.clue}
                {word.completed && <span className="ml-2 text-green-600">✓</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game Complete */}
      {gameComplete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
            <p className="text-xl mb-4">You completed all puzzles!</p>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
              Final Score: {score}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
