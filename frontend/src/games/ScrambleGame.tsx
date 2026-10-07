import React, { useState } from 'react';
import { RotateCcw, ArrowRight, CheckCheck, Shuffle } from 'lucide-react';
import { InteractiveGameProps } from './QuizGame';

export const ScrambleGame: React.FC<InteractiveGameProps> = ({
  questions,
  savedAnswers,
  onCompleteGame,
  submittingGame,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Track picked letter indices per questionId so user can navigate freely and submit at the end
  const [pickedByQuestion, setPickedByQuestion] = useState<Record<number, number[]>>(() => {
    const init: Record<number, number[]> = {};
    for (const q of questions) {
      const saved = savedAnswers[q.id]?.submitted_answer;
      const scrambled = String(q.options?.scrambled || '').split('');
      if (saved && typeof saved === 'string') {
        const used: number[] = [];
        for (const ch of saved.toUpperCase()) {
          const foundIdx = scrambled.findIndex((c, idx) => c === ch && !used.includes(idx));
          if (foundIdx !== -1) used.push(foundIdx);
        }
        if (used.length > 0) init[q.id] = used;
      }
    }
    return init;
  });

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const scrambledStr = String(currentQ.options?.scrambled || '');
  const scrambledLetters = scrambledStr.split('');
  const pickedIndices = pickedByQuestion[currentQ.id] || [];
  const currentBuiltWord = pickedIndices.map((idx) => scrambledLetters[idx]).join('');

  const handleTileClick = (idx: number) => {
    if (pickedIndices.includes(idx)) return;
    const nextPicked = [...pickedIndices, idx];
    setPickedByQuestion((prev) => ({ ...prev, [currentQ.id]: nextPicked }));
  };

  const handleRemoveSlot = (slotPosition: number) => {
    setPickedByQuestion((prev) => ({
      ...prev,
      [currentQ.id]: (prev[currentQ.id] || []).filter((_, i) => i !== slotPosition),
    }));
  };

  const buildFinalAnswersMap = (): Record<number, string> => {
    const finalMap: Record<number, string> = {};
    for (const q of questions) {
      const letters = String(q.options?.scrambled || '').split('');
      const indices = pickedByQuestion[q.id] || [];
      if (indices.length > 0) {
        finalMap[q.id] = indices.map((i) => letters[i]).join('');
      }
    }
    return finalMap;
  };

  const completedCount = questions.filter((q) => {
    const len = String(q.options?.scrambled || '').length;
    return (pickedByQuestion[q.id]?.length || 0) === len;
  }).length;

  return (
    <div className="space-y-6">
      {/* Progress Pills */}
      <div className="bg-white rounded-2xl border border-[#D6E5E1] p-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {questions.map((q, idx) => {
            const len = String(q.options?.scrambled || '').length;
            const isFilled = (pickedByQuestion[q.id]?.length || 0) === len;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-9 h-9 rounded-xl font-bold text-xs border transition-all ${
                  idx === currentIndex
                    ? 'bg-[#007A63] text-white border-[#005F4F] ring-2 ring-[#007A63]/30'
                    : isFilled
                    ? 'bg-[#E6F4F1] text-[#005F4F] border-[#007A63]'
                    : 'bg-[#F7FBFA] text-[#64716D] border-[#D6E5E1]'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
        <span className="text-xs font-bold text-[#007A63]">
          Terildi: {completedCount} / {questions.length}
        </span>
      </div>

      {/* Main Scramble Card */}
      <div className="bg-white rounded-3xl border border-[#D6E5E1] p-6 sm:p-10 shadow-subtle text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F4F1] text-[#007A63] text-xs font-bold">
          <Shuffle className="w-3.5 h-3.5" />
          <span>Termin #{currentIndex + 1} • {scrambledLetters.length} ta harf</span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-[#17211F] max-w-xl mx-auto">
          {currentQ.question_text}
        </h2>

        {/* Answer Slots */}
        <div className="flex items-center justify-center gap-2 flex-wrap py-2">
          {scrambledLetters.map((_, slotIdx) => {
            const ch = currentBuiltWord[slotIdx] || '';
            return (
              <button
                key={slotIdx}
                type="button"
                disabled={!ch}
                onClick={() => handleRemoveSlot(slotIdx)}
                className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl border-2 font-mono font-extrabold text-xl flex items-center justify-center transition-all ${
                  ch
                    ? 'bg-[#E6F4F1] border-[#007A63] text-[#005F4F]'
                    : 'bg-[#F7FBFA] border-dashed border-[#D6E5E1] text-transparent'
                }`}
              >
                {ch || '_'}
              </button>
            );
          })}
        </div>

        {/* Scrambled Source Letter Tiles */}
        <div className="space-y-3 pt-2">
          <div className="text-xs text-[#64716D]">
            Harflar ustiga bosib so‘zni tering (barcha javoblar o‘yin yakunida tekshiriladi):
          </div>
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            {scrambledLetters.map((letter, idx) => {
              const used = pickedIndices.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={used}
                  onClick={() => handleTileClick(idx)}
                  className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl font-mono font-extrabold text-lg border transition-all ${
                    used
                      ? 'bg-slate-100 border-slate-200 text-slate-300 scale-95 cursor-not-allowed'
                      : 'bg-white border-[#D6E5E1] hover:border-[#007A63] hover:bg-[#E6F4F1]/50 text-[#17211F] shadow-subtle hover:-translate-y-0.5'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {pickedIndices.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setPickedByQuestion((prev) => ({ ...prev, [currentQ.id]: [] }))
              }
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64716D] hover:text-[#17211F] mt-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Qaytadan terish</span>
            </button>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="pt-6 border-t border-[#D6E5E1] flex items-center justify-between">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            className="px-4 py-2.5 rounded-xl border border-[#D6E5E1] text-xs sm:text-sm font-semibold text-[#17211F] disabled:opacity-40"
          >
            Oldingi
          </button>

          <div className="flex items-center gap-3">
            {currentIndex < questions.length - 1 && (
              <button
                type="button"
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="px-5 py-2.5 rounded-xl bg-[#007A63] hover:bg-[#005F4F] text-white text-xs sm:text-sm font-semibold flex items-center gap-2"
              >
                <span>Keyingi so‘z</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              disabled={submittingGame}
              onClick={() => onCompleteGame(buildFinalAnswersMap())}
              className="px-5 py-2.5 rounded-xl bg-[#005F4F] hover:bg-[#00463A] text-white text-xs sm:text-sm font-bold flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Yakunlash ({completedCount}/{questions.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
