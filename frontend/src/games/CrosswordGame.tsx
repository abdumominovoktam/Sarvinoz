import React, { useState, useRef, useMemo } from 'react';
import {
  Grid,
  Type,
  ArrowRight,
  ArrowDown,
  Lightbulb,
  CheckCircle2,
  CheckCheck,
} from 'lucide-react';
import { InteractiveGameProps } from './QuizGame';

interface ClueMeta {
  id: number;
  clueNumber: number;
  direction: 'gorizontal' | 'vertikal';
  row: number;
  col: number;
  length: number;
  text: string;
  cells: [number, number][];
}

const GRID_SIZE = 14;

export const CrosswordGame: React.FC<InteractiveGameProps> = ({
  questions,
  savedAnswers,
  onCompleteGame,
  submittingGame,
}) => {
  // Parse 12 clues with 2D coordinates from questions
  const clues: ClueMeta[] = useMemo(() => {
    return questions
      .map((q, idx) => {
        const opts = q.options || {};
        const clueNumber = Number(opts.clue_number || idx + 1);
        const direction: 'gorizontal' | 'vertikal' =
          opts.direction === 'gorizontal' ? 'gorizontal' : 'vertikal';
        const row = Number(opts.row ?? idx);
        const col = Number(opts.col ?? 0);
        const length = Number(opts.length || 5);
        const cells: [number, number][] = [];
        for (let i = 0; i < length; i++) {
          const r = direction === 'vertikal' ? row + i : row;
          const c = direction === 'gorizontal' ? col + i : col;
          cells.push([r, c]);
        }
        return {
          id: q.id,
          clueNumber,
          direction,
          row,
          col,
          length,
          text: q.question_text,
          cells,
        };
      })
      .sort((a, b) => a.clueNumber - b.clueNumber);
  }, [questions]);

  const horizontalClues = useMemo(
    () => clues.filter((c) => c.direction === 'gorizontal'),
    [clues]
  );
  const verticalClues = useMemo(
    () => clues.filter((c) => c.direction === 'vertikal'),
    [clues]
  );

  // Map of "r-c" -> entered uppercase character
  const [cellValues, setCellValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const c of clues) {
      const saved = savedAnswers[c.id]?.submitted_answer;
      if (saved && typeof saved === 'string') {
        const clean = saved.toUpperCase();
        c.cells.forEach(([r, col], i) => {
          if (clean[i] && clean[i] !== ' ') {
            init[`${r}-${col}`] = clean[i];
          }
        });
      }
    }
    return init;
  });

  const [activeClueId, setActiveClueId] = useState<number>(
    () => horizontalClues[0]?.id || clues[0]?.id || 0
  );

  const cellInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Build lookup structures for the 14x14 matrix
  const matrixMeta = useMemo(() => {
    const activeCells = new Set<string>();
    const startNumbers: Record<string, number> = {};
    const cellToClues: Record<string, ClueMeta[]> = {};

    for (const clue of clues) {
      const startKey = `${clue.row}-${clue.col}`;
      if (!startNumbers[startKey]) {
        startNumbers[startKey] = clue.clueNumber;
      }
      for (const [r, c] of clue.cells) {
        const key = `${r}-${c}`;
        activeCells.add(key);
        if (!cellToClues[key]) cellToClues[key] = [];
        cellToClues[key].push(clue);
      }
    }
    return { activeCells, startNumbers, cellToClues };
  }, [clues]);

  const activeClue = useMemo(
    () => clues.find((c) => c.id === activeClueId) || clues[0],
    [clues, activeClueId]
  );

  const activeClueCellsSet = useMemo(() => {
    const set = new Set<string>();
    if (activeClue) {
      for (const [r, c] of activeClue.cells) {
        set.add(`${r}-${c}`);
      }
    }
    return set;
  }, [activeClue]);

  const focusCell = (r: number, c: number) => {
    const el = cellInputRefs.current[`${r}-${c}`];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const selectClueAndFocus = (clue: ClueMeta) => {
    setActiveClueId(clue.id);
    const firstEmpty = clue.cells.find(([r, c]) => !cellValues[`${r}-${c}`]);
    const target = firstEmpty || clue.cells[0];
    if (target) {
      focusCell(target[0], target[1]);
    }
  };

  const handleCellClick = (r: number, c: number) => {
    const key = `${r}-${c}`;
    const cluesHere = matrixMeta.cellToClues[key] || [];
    if (cluesHere.length === 0) return;

    if (cluesHere.length > 1 && cluesHere.some((cl) => cl.id === activeClueId)) {
      const other = cluesHere.find((cl) => cl.id !== activeClueId);
      if (other) {
        setActiveClueId(other.id);
      }
    } else if (!cluesHere.some((cl) => cl.id === activeClueId)) {
      setActiveClueId(cluesHere[0].id);
    }
    focusCell(r, c);
  };

  const handleCharInput = (r: number, c: number, rawVal: string) => {
    const ch = rawVal.slice(-1).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const key = `${r}-${c}`;
    const nextValues = { ...cellValues, [key]: ch };
    setCellValues(nextValues);

    if (ch && activeClue) {
      const idx = activeClue.cells.findIndex(([cr, cc]) => cr === r && cc === c);
      if (idx !== -1 && idx < activeClue.cells.length - 1) {
        const [nr, nc] = activeClue.cells[idx + 1];
        focusCell(nr, nc);
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    r: number,
    c: number
  ) => {
    const key = `${r}-${c}`;
    if (e.key === 'Backspace') {
      if (cellValues[key]) {
        const nextValues = { ...cellValues, [key]: '' };
        setCellValues(nextValues);
      } else if (activeClue) {
        const idx = activeClue.cells.findIndex(([cr, cc]) => cr === r && cc === c);
        if (idx > 0) {
          const [pr, pc] = activeClue.cells[idx - 1];
          const prevKey = `${pr}-${pc}`;
          const nextValues = { ...cellValues, [prevKey]: '' };
          setCellValues(nextValues);
          focusCell(pr, pc);
        }
      }
      e.preventDefault();
      return;
    }

    if (e.key === 'ArrowRight' && matrixMeta.activeCells.has(`${r}-${c + 1}`)) {
      e.preventDefault();
      focusCell(r, c + 1);
    } else if (e.key === 'ArrowLeft' && matrixMeta.activeCells.has(`${r}-${c - 1}`)) {
      e.preventDefault();
      focusCell(r, c - 1);
    } else if (e.key === 'ArrowDown' && matrixMeta.activeCells.has(`${r + 1}-${c}`)) {
      e.preventDefault();
      focusCell(r + 1, c);
    } else if (e.key === 'ArrowUp' && matrixMeta.activeCells.has(`${r - 1}-${c}`)) {
      e.preventDefault();
      focusCell(r - 1, c);
    }
  };

  // Filled words count (all letters of that clue entered)
  const filledWordsCount = useMemo(() => {
    return clues.filter((cl) =>
      cl.cells.every(([r, c]) => Boolean(cellValues[`${r}-${c}`]))
    ).length;
  }, [clues, cellValues]);

  // Total letter slots across the 12 words (71) and filled letter slots
  const totalWordLetters = useMemo(
    () => clues.reduce((acc, cl) => acc + cl.length, 0),
    [clues]
  );
  const filledWordLetters = useMemo(() => {
    let count = 0;
    for (const cl of clues) {
      for (const [r, c] of cl.cells) {
        if (cellValues[`${r}-${c}`]) count++;
      }
    }
    return count;
  }, [clues, cellValues]);

  const letterPercent =
    totalWordLetters > 0 ? Math.round((filledWordLetters / totalWordLetters) * 100) : 0;

  const handleFinishCrossword = () => {
    const finalAnswers: Record<number, string> = {};
    for (const clue of clues) {
      const word = clue.cells.map(([r, c]) => cellValues[`${r}-${c}`] || '').join('');
      if (word.trim()) {
        finalAnswers[clue.id] = word.trim();
      }
    }
    onCompleteGame(finalAnswers);
  };

  return (
    <div className="space-y-4">
      {/* Top Amber Tip Banner (Matches Screenshot 1) */}
      <div className="bg-[#FDF8EC] border border-[#F2DEC0] rounded-2xl px-4 py-3 flex items-center gap-3 text-[#7A5411] text-xs sm:text-sm">
        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
        <p>
          Ta‘riflar ikki ustunda: <strong className="font-bold">«Gorizontal»</strong> (chapdan
          o‘ngga) va <strong className="font-bold">«Vertikal»</strong> (yuqoridan pastga). Avval
          qisqaroq so‘zlardan boshlash osonroq.
        </p>
      </div>

      {/* Status Bar & Progress Line (Matches Screenshot 1) */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4F1] border border-[#B8E2D6] text-[#007A63] text-xs font-bold">
              <Grid className="w-3.5 h-3.5" />
              <span>Krossvord</span>
            </span>

            <span className="text-xs sm:text-sm font-semibold text-[#64716D]">
              To‘ldirildi:{' '}
              <strong className="text-[#17211F] font-extrabold">
                {filledWordsCount} / {clues.length}
              </strong>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#D6E5E1] text-[#64716D] text-xs font-semibold">
              <Type className="w-3.5 h-3.5" />
              <span>
                Harf: {filledWordLetters} / {totalWordLetters} ({letterPercent}%)
              </span>
            </span>
          </div>

          <button
            type="button"
            disabled={submittingGame}
            onClick={handleFinishCrossword}
            className="px-4 py-1.5 rounded-xl bg-[#007A63] hover:bg-[#005F4F] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Topshirish</span>
          </button>
        </div>

        {/* Full-width Thin Progress Bar */}
        <div className="w-full h-1.5 bg-[#E2ECE9] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#007A63] rounded-full transition-all duration-300"
            style={{ width: `${letterPercent}%` }}
          />
        </div>
      </div>

      {/* 3-Column Layout: Left 14x14 Crossword Grid | Middle Gorizontal (5) | Right Vertikal (7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Column 1: 14x14 2D Crossword Grid */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#D6E5E1] p-3.5 sm:p-5 shadow-xs">
          <div
            className="bg-[#DCECE7] p-2 sm:p-3 rounded-2xl border border-[#C5DFD7] grid gap-1 mx-auto w-full aspect-square max-w-[470px]"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: GRID_SIZE }).map((_, rIdx) =>
              Array.from({ length: GRID_SIZE }).map((__, cIdx) => {
                const key = `${rIdx}-${cIdx}`;
                const isActiveCell = matrixMeta.activeCells.has(key);

                if (!isActiveCell) {
                  return (
                    <div
                      key={key}
                      className="rounded-[5px] bg-[#E5F2EE]/80 border border-[#D2E6E0]/60"
                    />
                  );
                }

                const startNum = matrixMeta.startNumbers[key];
                const isInSelectedWord = activeClueCellsSet.has(key);
                const cluesForCell = matrixMeta.cellToClues[key] || [];
                const val = cellValues[key] || '';

                return (
                  <div
                    key={key}
                    onClick={() => handleCellClick(rIdx, cIdx)}
                    className={`relative rounded-[5px] border transition-all flex items-center justify-center cursor-pointer select-none ${
                      isInSelectedWord
                        ? 'bg-[#E6F4F1] border-[#007A63]'
                        : val
                        ? 'bg-[#F3FAF8] border-[#8EC5B6]'
                        : 'bg-white border-[#BFD8D0] hover:border-[#007A63]'
                    }`}
                  >
                    {startNum !== undefined && (
                      <span className="absolute top-[1px] left-[2px] text-[8px] sm:text-[9px] leading-none font-extrabold text-[#007A63] pointer-events-none">
                        {startNum}
                      </span>
                    )}
                    <input
                      ref={(el) => {
                        cellInputRefs.current[key] = el;
                      }}
                      type="text"
                      maxLength={1}
                      value={val}
                      onFocus={() => {
                        if (!cluesForCell.some((cl) => cl.id === activeClueId) && cluesForCell[0]) {
                          setActiveClueId(cluesForCell[0].id);
                        }
                      }}
                      onChange={(e) => handleCharInput(rIdx, cIdx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, rIdx, cIdx)}
                      className="w-full h-full bg-transparent text-center font-mono font-extrabold text-xs sm:text-sm text-[#17211F] uppercase focus:outline-none focus:ring-2 focus:ring-[#007A63] rounded-[4px] pt-1"
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Columns 2 & 3: Gorizontal (5) and Vertikal (7) Clue Lists */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gorizontal Column */}
          <div className="space-y-2.5">
            <div className="bg-[#EEF6F4] border border-[#D6E5E1] rounded-2xl px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-extrabold text-[#17211F]">
                <ArrowRight className="w-4 h-4 text-[#007A63]" />
                <span>Gorizontal</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#D6E5E1] text-xs font-extrabold text-[#007A63]">
                {horizontalClues.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {horizontalClues.map((clue) => {
                const isSelected = clue.id === activeClueId;
                const isFilled = clue.cells.every(([r, c]) => Boolean(cellValues[`${r}-${c}`]));

                return (
                  <div
                    key={clue.id}
                    onClick={() => selectClueAndFocus(clue)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#E6F4F1]/60 border-[#007A63] shadow-xs'
                        : isFilled
                        ? 'bg-[#F2FAF7] border-[#007A63]/40'
                        : 'bg-white border-[#D6E5E1] hover:border-[#007A63]/60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-extrabold shrink-0 mt-0.5 ${
                          isFilled
                            ? 'bg-[#007A63] text-white'
                            : 'bg-[#E6F4F1] text-[#007A63] border border-[#B8E2D6]'
                        }`}
                      >
                        #{clue.clueNumber}
                      </span>

                      <div className="flex-1 text-xs sm:text-[13px] leading-relaxed text-[#17211F]">
                        <span>{clue.text} </span>
                        <span className="text-[#007A63] font-semibold">
                          ({clue.length} harf)
                        </span>
                      </div>

                      {isFilled && (
                        <CheckCircle2 className="w-4 h-4 text-[#007A63] shrink-0 mt-0.5" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vertikal Column */}
          <div className="space-y-2.5">
            <div className="bg-[#EEF6F4] border border-[#D6E5E1] rounded-2xl px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-extrabold text-[#17211F]">
                <ArrowDown className="w-4 h-4 text-[#007A63]" />
                <span>Vertikal</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#D6E5E1] text-xs font-extrabold text-[#007A63]">
                {verticalClues.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {verticalClues.map((clue) => {
                const isSelected = clue.id === activeClueId;
                const isFilled = clue.cells.every(([r, c]) => Boolean(cellValues[`${r}-${c}`]));

                return (
                  <div
                    key={clue.id}
                    onClick={() => selectClueAndFocus(clue)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#E6F4F1]/60 border-[#007A63] shadow-xs'
                        : isFilled
                        ? 'bg-[#F2FAF7] border-[#007A63]/40'
                        : 'bg-white border-[#D6E5E1] hover:border-[#007A63]/60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-extrabold shrink-0 mt-0.5 ${
                          isFilled
                            ? 'bg-[#007A63] text-white'
                            : 'bg-[#E6F4F1] text-[#007A63] border border-[#B8E2D6]'
                        }`}
                      >
                        #{clue.clueNumber}
                      </span>

                      <div className="flex-1 text-xs sm:text-[13px] leading-relaxed text-[#17211F]">
                        <span>{clue.text} </span>
                        <span className="text-[#007A63] font-semibold">
                          ({clue.length} harf)
                        </span>
                      </div>

                      {isFilled && (
                        <CheckCircle2 className="w-4 h-4 text-[#007A63] shrink-0 mt-0.5" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
