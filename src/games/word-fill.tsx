import { useState, useEffect } from 'react';
import { GameProps, useKey } from './shared';
import wordFillLevels from '../data/word-fill-levels.json';

interface Cell {
  char: string;
  hidden: boolean;
  solved: boolean;
  isSpace: boolean;
}

interface Level {
  id: string;
  difficulty: string;
  text: string;
  maskMode: string;
  hint: string;
}

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

function buildMask(text: string, mode: string): Cell[] {
  const words = text.split(' ');
  const cells: Cell[] = [];
  
  words.forEach((word, wordIndex) => {
    [...word].forEach((char, charIndex) => {
      let hidden = false;
      
      if (mode === 'vowels') {
        hidden = VOWELS.has(char);
      } else if (mode === 'random40') {
        // Hide ~40% of letters, but never the first letter of each word
        hidden = charIndex > 0 && Math.random() < 0.4;
      } else if (mode === 'keepFirstLetter') {
        // Hide everything except first letter of each word
        hidden = charIndex > 0;
      }
      
      cells.push({
        char,
        hidden,
        solved: !hidden,
        isSpace: false
      });
    });
    
    // Add space between words (except after last word)
    if (wordIndex < words.length - 1) {
      cells.push({
        char: ' ',
        hidden: false,
        solved: true,
        isSpace: true
      });
    }
  });
  
  return cells;
}

export function WordFill({ onScore, onFinish, fx, paused }: GameProps) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [cells, setCells] = useState<Cell[]>([]);
  const [activeCellIndex, setActiveCellIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [message, setMessage] = useState('');
  const [gameComplete, setGameComplete] = useState(false);

  const levels = wordFillLevels.levels as Level[];
  const currentLevel = levels[currentLevelIndex];

  useEffect(() => {
    if (currentLevel) {
      setCells(buildMask(currentLevel.text, currentLevel.maskMode));
      setActiveCellIndex(null);
      setShowHint(false);
      setMessage('');
    }
  }, [currentLevelIndex, currentLevel]);

  useEffect(() => {
    // Auto-select first unsolved cell
    if (activeCellIndex === null && cells.length > 0) {
      const firstUnsolved = cells.findIndex(c => c.hidden && !c.solved);
      if (firstUnsolved !== -1) {
        setActiveCellIndex(firstUnsolved);
      }
    }
  }, [cells, activeCellIndex]);

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
    }
  });

  const handleCellClick = (index: number) => {
    if (cells[index].isSpace || cells[index].solved) return;
    setActiveCellIndex(index);
  };

  const handleKeyPress = (key: string) => {
    if (activeCellIndex === null || gameComplete) return;
    
    const cell = cells[activeCellIndex];
    if (cell.isSpace || cell.solved) return;

    if (key === 'BACKSPACE') {
      // Move to previous unsolved cell
      const prevIndex = findPreviousUnsolved(activeCellIndex);
      if (prevIndex !== null) {
        setActiveCellIndex(prevIndex);
      }
      return;
    }

    const letter = key.toUpperCase();
    if (!/^[A-Z]$/.test(letter)) return;

    if (letter === cell.char) {
      // Correct!
      const newCells = [...cells];
      newCells[activeCellIndex] = { ...cell, solved: true };
      setCells(newCells);
      
      fx('good');
      setMessage('Nice! ✓');
      
      // Check if puzzle is complete
      const allSolved = newCells.every(c => c.isSpace || c.solved);
      if (allSolved) {
        handlePuzzleComplete();
      } else {
        // Auto-advance to next unsolved cell
        const nextIndex = findNextUnsolved(activeCellIndex);
        if (nextIndex !== null) {
          setActiveCellIndex(nextIndex);
        }
      }
    } else {
      // Wrong - shake animation
      fx('bad');
      setMessage('Almost! Try again');
      shakeCell(activeCellIndex);
    }
  };

  const findNextUnsolved = (currentIndex: number): number | null => {
    for (let i = currentIndex + 1; i < cells.length; i++) {
      if (cells[i].hidden && !cells[i].solved) return i;
    }
    // Wrap around
    for (let i = 0; i < currentIndex; i++) {
      if (cells[i].hidden && !cells[i].solved) return i;
    }
    return null;
  };

  const findPreviousUnsolved = (currentIndex: number): number | null => {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (cells[i].hidden && !cells[i].solved) return i;
    }
    // Wrap around
    for (let i = cells.length - 1; i > currentIndex; i--) {
      if (cells[i].hidden && !cells[i].solved) return i;
    }
    return null;
  };

  const handlePuzzleComplete = () => {
    const baseScore = 50;
    const hintPenalty = hintsUsed * 10;
    const puzzleScore = Math.max(10, baseScore - hintPenalty);
    
    const newScore = score + puzzleScore;
    const newStreak = streak + 1;
    
    setScore(newScore);
    setStreak(newStreak);
    setHintsUsed(0);
    onScore(puzzleScore, newStreak);
    
    setMessage(`🎉 +${puzzleScore} points!`);
    
    // Check if all levels complete
    if (currentLevelIndex >= levels.length - 1) {
      setGameComplete(true);
      fx('win');
      setTimeout(() => {
        onFinish({
          score: newScore,
          correct: cells.filter(c => !c.isSpace).length,
          total: cells.filter(c => !c.isSpace).length,
          duration: 0,
        });
      }, 2000);
    } else {
      // Move to next level after delay
      setTimeout(() => {
        setCurrentLevelIndex(prev => prev + 1);
      }, 1500);
    }
  };

  const useHint = () => {
    if (gameComplete) return;
    
    // Find first unsolved cell
    const unsolvedIndex = cells.findIndex(c => c.hidden && !c.solved);
    if (unsolvedIndex === -1) return;
    
    const newCells = [...cells];
    newCells[unsolvedIndex] = { ...newCells[unsolvedIndex], solved: true };
    setCells(newCells);
    setHintsUsed(prev => prev + 1);
    
    fx('good');
    setMessage('Hint revealed! (-10 points)');
    
    // Check if puzzle is complete
    const allSolved = newCells.every(c => c.isSpace || c.solved);
    if (allSolved) {
      handlePuzzleComplete();
    }
  };

  const shakeCell = (index: number) => {
    const cellElements = document.querySelectorAll('[data-cell-index]');
    const cellEl = cellElements[index] as HTMLElement;
    if (cellEl) {
      cellEl.classList.add('anim-shake');
      setTimeout(() => {
        cellEl.classList.remove('anim-shake');
      }, 300);
    }
  };

  if (!currentLevel) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="w-full flex justify-between items-center text-sm">
        <div className="flex gap-2 items-center">
          <span className="font-semibold">Level {currentLevelIndex + 1}/{levels.length}</span>
          {streak > 0 && (
            <span className="flex items-center gap-1 text-orange-500">
              🔥 {streak}
            </span>
          )}
        </div>
        <div className="font-bold text-lg">Score: {score}</div>
      </div>

      {/* Hint */}
      {showHint && (
        <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
          <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">💡 Hint</div>
          <div className="text-lg">{currentLevel.hint}</div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className="text-center text-lg font-semibold animate-fade-in">
          {message}
        </div>
      )}

      {/* Puzzle Grid */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {cells.map((cell, index) => {
            if (cell.isSpace) {
              return <div key={index} className="w-4" />;
            }
            
            const isActive = index === activeCellIndex;
            const isSolved = cell.solved;
            
            return (
              <button
                key={index}
                data-cell-index={index}
                onClick={() => handleCellClick(index)}
                disabled={isSolved}
                className={`
                  w-12 h-14 sm:w-14 sm:h-16 text-2xl sm:text-3xl font-bold rounded-lg
                  border-2 transition-all duration-200
                  ${isSolved 
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600 text-green-700 dark:text-green-400' 
                    : isActive
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 ring-2 ring-blue-300 dark:ring-blue-600'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                  }
                  ${!isSolved && 'cursor-pointer'}
                `}
                aria-label={isSolved ? `Letter ${cell.char}` : `Blank letter ${index + 1}`}
              >
                {isSolved ? cell.char : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowHint(!showHint)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
        >
          💡 {showHint ? 'Hide' : 'Show'} Hint
        </button>
        <button
          onClick={useHint}
          disabled={gameComplete}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
        >
          👁 Reveal Letter
        </button>
      </div>

      {/* On-screen Keyboard */}
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl p-4 shadow-lg">
        <div className="flex flex-col gap-2">
          {/* Row 1: QWERTYUIOP */}
          <div className="flex justify-center gap-1 sm:gap-2">
            {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map(key => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="w-8 h-12 sm:w-10 sm:h-14 bg-white dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-gray-300 dark:border-gray-600 rounded-lg font-bold text-lg sm:text-xl transition-colors"
              >
                {key}
              </button>
            ))}
          </div>
          
          {/* Row 2: ASDFGHJKL */}
          <div className="flex justify-center gap-1 sm:gap-2">
            {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map(key => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="w-8 h-12 sm:w-10 sm:h-14 bg-white dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-gray-300 dark:border-gray-600 rounded-lg font-bold text-lg sm:text-xl transition-colors"
              >
                {key}
              </button>
            ))}
          </div>
          
          {/* Row 3: ZXCVBNM + Backspace */}
          <div className="flex justify-center gap-1 sm:gap-2">
            {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map(key => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="w-8 h-12 sm:w-10 sm:h-14 bg-white dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-gray-300 dark:border-gray-600 rounded-lg font-bold text-lg sm:text-xl transition-colors"
              >
                {key}
              </button>
            ))}
            <button
              onClick={() => handleKeyPress('BACKSPACE')}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-lg transition-colors"
              aria-label="Backspace"
            >
              ⌫
            </button>
          </div>
        </div>
      </div>

      {/* Game Complete */}
      {gameComplete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
            <p className="text-xl mb-4">You completed all levels!</p>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
              Final Score: {score}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {streak >= 10 ? '🏆 Amazing streak!' : streak >= 5 ? '🔥 Great job!' : 'Well done!'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
