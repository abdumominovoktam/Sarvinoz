import React, { useState } from 'react';
import { Link2, CheckCheck, RotateCcw } from 'lucide-react';
import { InteractiveGameProps } from './QuizGame';

export const MatchingGame: React.FC<InteractiveGameProps> = ({
  questions,
  sessionData,
  savedAnswers,
  onCompleteGame,
  submittingGame,
}) => {
  const definitions: string[] = sessionData?.shuffled_definitions || [];

  // Map of questionId -> chosen definition string (accepted whether right or wrong, checked at end)
  const [matchedPairs, setMatchedPairs] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (const [qid, val] of Object.entries(savedAnswers)) {
      if (val?.submitted_answer) {
        init[Number(qid)] = String(val.submitted_answer);
      }
    }
    return init;
  });

  const [selectedTermQId, setSelectedTermQId] = useState<number | null>(() => {
    const firstUnpaired = questions.find((q) => !savedAnswers[q.id]?.submitted_answer);
    return firstUnpaired ? firstUnpaired.id : questions[0]?.id || null;
  });

  // Map definition text -> term index (1-based) that selected it
  const defToTermIndex: Record<string, { qId: number; num: number; termText: string }> = {};
  questions.forEach((q, idx) => {
    const chosenDef = matchedPairs[q.id];
    if (chosenDef) {
      defToTermIndex[chosenDef] = {
        qId: q.id,
        num: idx + 1,
        termText: q.question_text,
      };
    }
  });

  const handleTermClick = (qId: number) => {
    // If clicking an already-paired term, unpair it and select it so user can re-choose if desired
    if (matchedPairs[qId]) {
      setMatchedPairs((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
      setSelectedTermQId(qId);
      return;
    }
    setSelectedTermQId(qId);
  };

  const handleSelectDefinition = (defText: string) => {
    if (!selectedTermQId) return;

    // If this definition was already assigned to another term, free that other term first
    const existingOwner = defToTermIndex[defText];
    const nextMatches = { ...matchedPairs };
    if (existingOwner && existingOwner.qId !== selectedTermQId) {
      delete nextMatches[existingOwner.qId];
    }

    nextMatches[selectedTermQId] = defText;
    setMatchedPairs(nextMatches);

    // Auto-select next unpaired term
    const nextUnmatched = questions.find((q) => !nextMatches[q.id]);
    setSelectedTermQId(nextUnmatched ? nextUnmatched.id : null);
  };

  const matchedCount = Object.keys(matchedPairs).length;

  return (
    <div className="space-y-5">
      {/* Status Header */}
      <div className="bg-white rounded-2xl border border-[#D6E5E1] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#17211F]">
          <Link2 className="w-4 h-4 text-[#007A63]" />
          <span>
            Chap ustundan tushunchani tanlang va o‘ng ustundan mos ta’rifni bosing. Natijalar
            yakunda tekshiriladi.
          </span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {matchedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setMatchedPairs({});
                setSelectedTermQId(questions[0]?.id || null);
              }}
              className="px-3 py-1 rounded-full bg-[#F7FBFA] hover:bg-[#E6F4F1] border border-[#D6E5E1] text-xs font-semibold text-[#64716D] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Tozalash</span>
            </button>
          )}
          <span className="px-3 py-1 rounded-full bg-[#E6F4F1] text-[#007A63] text-xs font-bold">
            Belgilandi: {matchedCount} / {questions.length}
          </span>
        </div>
      </div>

      {/* Two-Column Matching Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Terms */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#D6E5E1] p-5 space-y-3 shadow-subtle">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#64716D] mb-2">
            Tushunchalar (Terminlar)
          </h3>
          {questions.map((q, idx) => {
            const pairedDef = matchedPairs[q.id];
            const isPaired = Boolean(pairedDef);
            const isSelected = selectedTermQId === q.id;

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => handleTermClick(q.id)}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#007A63] border-[#005F4F] text-white shadow-sm'
                    : isPaired
                    ? 'bg-[#E6F4F1]/70 border-[#007A63]/50 text-[#17211F]'
                    : 'bg-[#F7FBFA] border-[#D6E5E1] hover:border-[#007A63] text-[#17211F]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : isPaired
                        ? 'bg-[#007A63] text-white'
                        : 'bg-white border border-[#D6E5E1] text-[#007A63]'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="font-bold text-sm sm:text-base">{q.question_text}</span>
                </div>

                {isPaired && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#B8E2D6] text-[#007A63] text-[11px] font-bold shrink-0">
                    Bog‘landi
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column: Shuffled Definitions */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#D6E5E1] p-5 flex flex-col justify-between space-y-4 shadow-subtle">
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#64716D] mb-2">
              Ilmiy Ta’riflar
            </h3>
            {definitions.map((defText, idx) => {
              const linkedInfo = defToTermIndex[defText];
              const isUsed = Boolean(linkedInfo);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDefinition(defText)}
                  className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between gap-3 ${
                    isUsed
                      ? 'bg-[#E6F4F1]/70 border-[#007A63]/50 text-[#005F4F] font-semibold'
                      : 'bg-[#F7FBFA] hover:bg-[#E6F4F1]/40 border-[#D6E5E1] hover:border-[#007A63] text-[#17211F] font-medium'
                  }`}
                >
                  <span>{defText}</span>
                  {linkedInfo && (
                    <span className="px-2.5 py-1 rounded-lg bg-[#007A63] text-white text-xs font-extrabold shrink-0">
                      #{linkedInfo.num} • {linkedInfo.termText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[#D6E5E1] flex justify-end">
            <button
              type="button"
              disabled={submittingGame}
              onClick={() => onCompleteGame(matchedPairs)}
              className="px-6 py-3 rounded-xl bg-[#005F4F] hover:bg-[#00463A] text-white text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Yakunlash va tekshirish ({matchedCount}/{questions.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
