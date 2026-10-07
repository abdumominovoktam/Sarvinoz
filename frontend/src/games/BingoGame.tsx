import React, { useState } from 'react';
import { Target, CheckCheck, Sparkles } from 'lucide-react';
import { InteractiveGameProps } from './QuizGame';

export const BingoGame: React.FC<InteractiveGameProps> = ({
  questions,
  sessionData,
  savedAnswers,
  onCompleteGame,
  submittingGame,
}) => {
  const boardCells: string[] =
    sessionData?.bingo_board || [
      '0', '1', '10', '11',
      '101', '111', '1000', 'A',
      'F', '12', '15', '16',
      '32', '64', '128', '255',
    ];

  // Map of questionId -> chosen cell value (accepted whether right or wrong, checked at end)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (const [qid, val] of Object.entries(savedAnswers)) {
      if (val?.submitted_answer !== undefined && val?.submitted_answer !== null) {
        init[Number(qid)] = String(val.submitted_answer);
      }
    }
    return init;
  });

  const [currentPromptIdx, setCurrentPromptIdx] = useState<number>(0);

  const activeQuestion = questions[currentPromptIdx] || questions[0];
  const answeredCount = Object.keys(selectedAnswers).length;

  // Map cellValue -> array of 1-based question numbers that picked this cell
  const cellToQuestionNums: Record<string, number[]> = {};
  questions.forEach((q, idx) => {
    const val = selectedAnswers[q.id];
    if (val !== undefined) {
      if (!cellToQuestionNums[val]) cellToQuestionNums[val] = [];
      cellToQuestionNums[val].push(idx + 1);
    }
  });

  // Check if any 4x4 row/col/diagonal has all 4 cells selected
  const isCellSelected = (idx: number) =>
    Boolean(cellToQuestionNums[boardCells[idx]]?.length);

  const bingoLines = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [8, 9, 10, 11],
    [12, 13, 14, 15],
    [0, 4, 8, 12],
    [1, 5, 9, 13],
    [2, 6, 10, 14],
    [3, 7, 11, 15],
    [0, 5, 10, 15],
    [3, 6, 9, 12],
  ];
  const completedBingoLines = bingoLines.filter((line) =>
    line.every((cellIndex) => isCellSelected(cellIndex))
  ).length;

  const handleCellClick = (cellValue: string) => {
    if (!activeQuestion) return;

    const updated = { ...selectedAnswers, [activeQuestion.id]: cellValue };
    setSelectedAnswers(updated);

    // Advance automatically to the next unanswered prompt
    const nextIdx = questions.findIndex((q, i) => i > currentPromptIdx && !updated[q.id]);
    if (nextIdx !== -1) {
      setCurrentPromptIdx(nextIdx);
    } else {
      const firstUnanswered = questions.findIndex((q) => !updated[q.id]);
      if (firstUnanswered !== -1) {
        setCurrentPromptIdx(firstUnanswered);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Active Bingo Prompt & Progress */}
      <div className="lg:col-span-5 bg-white rounded-3xl border border-[#D6E5E1] p-6 shadow-subtle flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4F1] text-[#007A63] text-xs font-bold">
              <Target className="w-3.5 h-3.5" />
              <span>Bingo Savol #{currentPromptIdx + 1}</span>
            </span>
            <span className="text-xs font-bold text-[#64716D]">
              Belgilandi: {answeredCount} / {questions.length}
            </span>
          </div>

          {activeQuestion && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#007A63] to-[#005F4F] text-white space-y-2 shadow-sm">
              <div className="text-xs text-emerald-100 uppercase font-semibold">
                Jadvaldan mos katakni bosing:
              </div>
              <h2 className="text-base sm:text-lg font-extrabold leading-snug">
                {activeQuestion.question_text}
              </h2>
              {selectedAnswers[activeQuestion.id] !== undefined && (
                <div className="pt-1 text-xs font-mono text-emerald-100">
                  Tanlangan javob:{' '}
                  <strong className="px-2 py-0.5 rounded bg-white/20 text-white">
                    {selectedAnswers[activeQuestion.id]}
                  </strong>
                </div>
              )}
            </div>
          )}

          {completedBingoLines > 0 && (
            <div className="p-3 rounded-xl bg-[#E6F4F1] border border-[#B8E2D6] text-[#005F4F] text-xs font-extrabold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#007A63]" />
              <span>Siz {completedBingoLines} ta qatorni to‘ldirdingiz!</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-[#F7FBFA] border border-[#D6E5E1] text-xs text-[#64716D]">
            Har bir savol uchun jadvaldan o‘zingiz to‘g‘ri deb hisoblagan katakni tanlang.
            Barcha javoblar o‘yin yakunida tekshiriladi.
          </div>

          {/* Prompt Selector List */}
          <div className="space-y-1.5 pt-1">
            <div className="text-xs font-bold text-[#64716D] uppercase">Barcha topshiriqlar:</div>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isCurrent = idx === currentPromptIdx;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentPromptIdx(idx)}
                    className={`py-2 rounded-xl font-bold text-xs border transition-all ${
                      isCurrent
                        ? 'bg-[#007A63] text-white border-[#005F4F] ring-2 ring-[#007A63]/30'
                        : isAnswered
                        ? 'bg-[#E6F4F1] text-[#005F4F] border-[#007A63]'
                        : 'bg-[#F7FBFA] text-[#64716D] border-[#D6E5E1]'
                    }`}
                  >
                    #{idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={submittingGame}
          onClick={() => onCompleteGame(selectedAnswers)}
          className="w-full py-3.5 px-5 rounded-xl bg-[#005F4F] hover:bg-[#00463A] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Bingoni yakunlash ({answeredCount}/{questions.length})</span>
        </button>
      </div>

      {/* Right: 4x4 Interactive Bingo Grid */}
      <div className="lg:col-span-7 bg-white rounded-3xl border border-[#D6E5E1] p-6 sm:p-8 shadow-subtle flex flex-col justify-center">
        <div className="text-center mb-4">
          <h3 className="text-lg font-extrabold text-[#17211F] tracking-wide">
            4×4 SANOQ SISTEMALARI BINGO JADVALI
          </h3>
          <p className="text-xs text-[#64716D]">
            Binary, Decimal va Hexadecimal qiymatlar maydoni
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-md mx-auto w-full">
          {boardCells.map((cellVal, idx) => {
            const qNums = cellToQuestionNums[cellVal] || [];
            const isChosenForCurrent =
              activeQuestion && selectedAnswers[activeQuestion.id] === cellVal;
            const isPicked = qNums.length > 0;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleCellClick(cellVal)}
                className={`aspect-square rounded-2xl border-2 font-mono font-extrabold text-lg sm:text-xl flex flex-col items-center justify-center gap-1 transition-all relative ${
                  isChosenForCurrent
                    ? 'bg-[#007A63] border-[#005F4F] text-white shadow-md scale-[0.98]'
                    : isPicked
                    ? 'bg-[#E6F4F1] border-[#007A63] text-[#005F4F]'
                    : 'bg-[#F7FBFA] hover:bg-[#E6F4F1]/60 border-[#D6E5E1] hover:border-[#007A63] text-[#17211F] shadow-subtle hover:-translate-y-0.5'
                }`}
              >
                <span>{cellVal}</span>
                {isPicked && (
                  <span
                    className={`text-[10px] font-sans font-bold px-1.5 py-0.5 rounded-md ${
                      isChosenForCurrent
                        ? 'bg-white/20 text-white'
                        : 'bg-[#007A63] text-white'
                    }`}
                  >
                    #{qNums.join(', #')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
