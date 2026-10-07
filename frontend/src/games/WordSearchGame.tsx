import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Grid,
  CheckCircle2,
  Search,
  Circle,
  Lightbulb,
  CheckCheck,
} from 'lucide-react';
import { InteractiveGameProps } from './QuizGame';

const DEFAULT_14X14_GRID: string[][] = [
  ['B', 'I', 'N', 'A', 'R', 'Y', 'K', 'L', 'M', 'O', 'P', 'Q', 'R', 'S'],
  ['D', 'E', 'C', 'I', 'M', 'A', 'L', 'P', 'R', 'C', 'T', 'U', 'V', 'W'],
  ['R', 'A', 'Z', 'R', 'Y', 'A', 'D', 'T', 'U', 'T', 'X', 'Y', 'Z', 'A'],
  ['H', 'E', 'X', 'A', 'D', 'E', 'C', 'I', 'M', 'A', 'L', 'B', 'C', 'D'],
  ['P', 'O', 'Z', 'I', 'T', 'S', 'I', 'O', 'N', 'L', 'E', 'F', 'G', 'H'],
  ['A', 'R', 'I', 'F', 'M', 'E', 'T', 'I', 'K', 'A', 'I', 'J', 'K', 'L'],
  ['A', 'L', 'G', 'O', 'R', 'I', 'T', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'],
  ['T', 'E', 'T', 'R', 'A', 'D', 'A', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  ['T', 'R', 'I', 'A', 'D', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
  ['B', 'Y', 'T', 'E', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'],
  ['B', 'I', 'T', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'A', 'B', 'C', 'D'],
  ['K', 'O', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'],
  ['O', 'C', 'T', 'A', 'L', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X'],
  ['Y', 'Z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
];

export const WordSearchGame: React.FC<InteractiveGameProps> = ({
  questions,
  sessionData,
  savedAnswers,
  onRecordAnswer,
  onCompleteGame,
  submittingGame,
}) => {
  const grid: string[][] = useMemo(() => {
    const raw = sessionData?.word_search_grid;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw;
    }
    return DEFAULT_14X14_GRID;
  }, [sessionData]);

  const gridSize = grid.length;

  const [foundWords, setFoundWords] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (const [qid, val] of Object.entries(savedAnswers)) {
      if (val.is_correct) {
        init[Number(qid)] = String(val.submitted_answer).toUpperCase();
      }
    }
    return init;
  });

  // Automatically locate coordinates of any already-found words on the grid
  const locateWordCellsOnGrid = useCallback(
    (targetWord: string): string[] => {
      const upper = targetWord.toUpperCase();
      const len = upper.length;
      const dirs = [
        [0, 1],
        [1, 0],
        [1, 1],
        [0, -1],
        [-1, 0],
        [-1, -1],
        [1, -1],
        [-1, 1],
      ];
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (grid[r]?.[c] !== upper[0]) continue;
          for (const [dr, dc] of dirs) {
            const coords: string[] = [];
            let matched = true;
            for (let i = 0; i < len; i++) {
              const nr = r + dr * i;
              const nc = c + dc * i;
              if (
                nr < 0 ||
                nr >= gridSize ||
                nc < 0 ||
                nc >= gridSize ||
                grid[nr]?.[nc] !== upper[i]
              ) {
                matched = false;
                break;
              }
              coords.push(`${nr}-${nc}`);
            }
            if (matched) return coords;
          }
        }
      }
      return [];
    },
    [grid, gridSize]
  );

  const [foundCells, setFoundCells] = useState<Set<string>>(() => {
    const init = new Set<string>();
    for (const val of Object.values(savedAnswers)) {
      if (val.is_correct && val.submitted_answer) {
        const coords = locateWordCellsOnGrid(String(val.submitted_answer));
        coords.forEach((k) => init.add(k));
      }
    }
    return init;
  });

  const [startCell, setStartCell] = useState<[number, number] | null>(null);
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const getLineCells = useCallback(
    (start: [number, number], end: [number, number]): [number, number][] => {
      const [r1, c1] = start;
      const [r2, c2] = end;
      const dr = r2 - r1;
      const dc = c2 - c1;
      const steps = Math.max(Math.abs(dr), Math.abs(dc));
      if (steps === 0) return [[r1, c1]];
      // Must be horizontal, vertical, or 45-deg diagonal
      if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) {
        return [];
      }
      const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
      const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
      const cells: [number, number][] = [];
      for (let i = 0; i <= steps; i++) {
        cells.push([r1 + stepR * i, c1 + stepC * i]);
      }
      return cells;
    },
    []
  );

  const verifySelectedWord = useCallback(
    async (candidateWord: string, cellsUsed: [number, number][]) => {
      const clean = candidateWord.trim().toUpperCase();
      if (clean.length < 2) return;
      const reversed = clean.split('').reverse().join('');

      const matchedQ = questions.find((q) => {
        if (foundWords[q.id]) return false;
        const target = String(q.options?.target_word || '').toUpperCase();
        return target === clean || target === reversed;
      });

      if (!matchedQ) {
        return;
      }

      const canonical = String(matchedQ.options?.target_word || clean).toUpperCase();
      try {
        const res = await onRecordAnswer(matchedQ.id, canonical);
        if (res.is_correct) {
          const nextFound = { ...foundWords, [matchedQ.id]: canonical };
          setFoundWords(nextFound);
          setFoundCells((prev) => {
            const next = new Set(prev);
            cellsUsed.forEach(([r, c]) => next.add(`${r}-${c}`));
            return next;
          });

          // Auto-complete game when all words are found
          if (Object.keys(nextFound).length === questions.length) {
            onCompleteGame(nextFound);
          }
        }
      } catch {
        // ignore transient network error
      }
    },
    [questions, foundWords, onRecordAnswer, onCompleteGame]
  );

  const finalizeSelection = useCallback(
    async (endCoord: [number, number]) => {
      if (!startCell) return;
      const line = getLineCells(startCell, endCoord);
      setStartCell(null);
      setHoverCell(null);
      setIsDragging(false);

      if (line.length >= 2) {
        const word = line.map(([rr, cc]) => grid[rr]?.[cc] || '').join('');
        await verifySelectedWord(word, line);
      }
    },
    [startCell, getLineCells, grid, verifySelectedWord]
  );

  // Global mouseup handler to end drag smoothly
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging && startCell && hoverCell) {
        // If user dragged across at least 2 cells, finalize on mouseup
        if (startCell[0] !== hoverCell[0] || startCell[1] !== hoverCell[1]) {
          finalizeSelection(hoverCell);
        } else {
          // Single click: keep startCell active for 2-click mode!
          setIsDragging(false);
        }
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, startCell, hoverCell, finalizeSelection]);

  const handleCellMouseDown = (r: number, c: number) => {
    // If already in 2-click selection mode, clicking second cell finalizes
    if (startCell && !isDragging) {
      finalizeSelection([r, c]);
      return;
    }
    setStartCell([r, c]);
    setHoverCell([r, c]);
    setIsDragging(true);
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    if (startCell) {
      setHoverCell([r, c]);
    }
  };

  const previewLine = useMemo(
    () => (startCell && hoverCell ? getLineCells(startCell, hoverCell) : []),
    [startCell, hoverCell, getLineCells]
  );
  const previewSet = useMemo(
    () => new Set(previewLine.map(([r, c]) => `${r}-${c}`)),
    [previewLine]
  );

  const foundCount = Object.keys(foundWords).length;
  const totalCount = questions.length;
  const remainingCount = Math.max(0, totalCount - foundCount);
  const progressPercent = totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Top Amber Tip Banner (Matches Screenshot 2) */}
      <div className="bg-[#FDF8EC] border border-[#F2DEC0] rounded-2xl px-4 py-3 flex items-center gap-3 text-[#7A5411] text-xs sm:text-sm">
        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
        <p>
          Avval uzunroq so‘zlarni qidirish osonroq. Diagonal yo‘nalishlarni ham tekshirishni
          unutmang!
        </p>
      </div>

      {/* Status Bar & Thin Progress Line (Matches Screenshot 2) */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4F1] border border-[#B8E2D6] text-[#007A63] text-xs font-bold">
              <Grid className="w-3.5 h-3.5" />
              <span>So‘z qidiruv</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#D6E5E1] text-[#64716D] text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#007A63]" />
              <span>
                Topildi: {foundCount} / {totalCount} so‘z
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {startCell && (
              <span className="text-xs font-bold text-[#007A63] animate-pulse">
                Belgilanmoqda...
              </span>
            )}

            <button
              type="button"
              disabled={submittingGame}
              onClick={() => onCompleteGame(foundWords)}
              className="px-4 py-1.5 rounded-xl bg-[#007A63] hover:bg-[#005F4F] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Topshirish</span>
            </button>
          </div>
        </div>

        {/* Full-width Thin Progress Bar */}
        <div className="w-full h-1.5 bg-[#E2ECE9] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#007A63] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main 2-Column Layout: Left 14x14 Letter Grid | Right Tushirilgan so'zlar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: 14x14 Interactive Letter Grid */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#D6E5E1] p-3.5 sm:p-5 shadow-xs">
          <div
            className="bg-[#EEF6F4] p-2 sm:p-3 rounded-2xl border border-[#D6E5E1] grid gap-1 mx-auto w-full aspect-square max-w-[500px] select-none touch-none"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
            }}
          >
            {grid.map((row, rIdx) =>
              row.map((letter, cIdx) => {
                const key = `${rIdx}-${cIdx}`;
                const isFound = foundCells.has(key);
                const isPreview = previewSet.has(key);
                const isStart = startCell?.[0] === rIdx && startCell?.[1] === cIdx;

                return (
                  <button
                    key={key}
                    type="button"
                    onMouseDown={() => handleCellMouseDown(rIdx, cIdx)}
                    onMouseEnter={() => handleCellMouseEnter(rIdx, cIdx)}
                    className={`rounded-[6px] font-mono font-bold text-xs sm:text-sm flex items-center justify-center transition-all select-none ${
                      isPreview || isStart
                        ? 'bg-[#B8E2D6] text-[#004D3F] border-2 border-dashed border-[#007A63]'
                        : isFound
                        ? 'bg-[#C8EFE4] text-[#005F4F] border border-[#007A63]'
                        : 'bg-[#F7FBFA] text-[#17211F] border border-[#DCEAE5] hover:border-[#007A63]/60'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Tushirilgan so'zlar Card (Matches Screenshot 2) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#D6E5E1] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base font-extrabold text-[#17211F]">
              <Search className="w-4 h-4 text-[#007A63]" />
              <span>Tushirilgan so‘zlar</span>
            </div>

            <span className="px-3 py-1 rounded-full bg-[#EEF6F4] border border-[#D6E5E1] text-xs font-extrabold text-[#17211F]">
              Qoldi: {remainingCount}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {questions.map((q) => {
              const isSolved = Boolean(foundWords[q.id]);
              const targetWord = String(q.options?.target_word || '').toUpperCase();

              return (
                <div
                  key={q.id}
                  className={`px-3.5 py-2.5 rounded-xl border transition-all flex items-center gap-2.5 ${
                    isSolved
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-800'
                      : 'bg-[#F7FBFA] border-[#D6E5E1] text-[#17211F]'
                  }`}
                >
                  {isSolved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-[#9BB0AA] shrink-0" />
                  )}
                  <span
                    className={`font-mono font-bold text-xs sm:text-sm tracking-wide ${
                      isSolved ? 'line-through text-emerald-700' : 'text-[#17211F]'
                    }`}
                  >
                    {targetWord}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-[#64716D] leading-relaxed pt-1">
            Harflarni sichqoncha yoki barmoq bilan bosib tortib belgilang. So‘zlar gorizontal,
            vertikal yoki diagonal bo‘lishi mumkin.
          </p>
        </div>
      </div>
    </div>
  );
};
