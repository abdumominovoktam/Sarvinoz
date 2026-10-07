import React, { useState } from 'react';
import { ArrowRight, CheckCheck } from 'lucide-react';
import { StudentQuestion } from '../types';

export interface InteractiveGameProps {
  gameOrder: number;
  questions: StudentQuestion[];
  sessionData: Record<string, any>;
  savedAnswers: Record<number, { submitted_answer: any; is_correct: boolean }>;
  onRecordAnswer: (
    questionId: number,
    answerValue: any
  ) => Promise<{
    question_id: number;
    is_correct: boolean;
    correct_answer: any;
    explanation: string;
  }>;
  onCompleteGame: (finalAnswersMap: Record<number, any>) => void;
  submittingGame: boolean;
}

export const QuizGame: React.FC<InteractiveGameProps> = ({
  questions,
  savedAnswers,
  onCompleteGame,
  submittingGame,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (const [qid, val] of Object.entries(savedAnswers)) {
      if (val?.submitted_answer) {
        init[Number(qid)] = String(val.submitted_answer);
      }
    }
    return init;
  });

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  const selectedChoice = answersMap[currentQuestion.id];
  const optionsObj = currentQuestion.options || {};

  const handleSelectOption = (key: string) => {
    setAnswersMap((prev) => ({ ...prev, [currentQuestion.id]: key }));
    // Auto-advance to next question after brief pause if not on last question
    if (currentIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
      }, 220);
    }
  };

  const answeredCount = Object.keys(answersMap).length;

  return (
    <div className="space-y-6">
      {/* Question Navigator Pills */}
      <div className="bg-white rounded-2xl border border-[#D6E5E1] p-4 shadow-subtle">
        <div className="flex items-center justify-between text-xs font-semibold text-[#64716D] mb-3">
          <span>
            Savol {currentIndex + 1} / {questions.length}
          </span>
          <span>
            Belgilandi: {answeredCount} / {questions.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => {
            const isAnswered = q.id in answersMap;
            const isCurrent = idx === currentIndex;
            let pillClass =
              'bg-[#F7FBFA] text-[#64716D] border-[#D6E5E1] hover:border-[#007A63]';
            if (isCurrent) {
              pillClass = 'bg-[#007A63] text-white border-[#005F4F] font-bold ring-2 ring-[#007A63]/30';
            } else if (isAnswered) {
              pillClass = 'bg-[#E6F4F1] text-[#005F4F] border-[#007A63] font-bold';
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-9 h-9 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center ${pillClass}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Question Card */}
      <div className="bg-white rounded-3xl border border-[#D6E5E1] p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="flex items-center justify-between gap-2">
          <span className="px-3 py-1 rounded-full bg-[#E6F4F1] text-[#007A63] text-xs font-bold">
            Savol #{currentIndex + 1}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#F7FBFA] border border-[#D6E5E1] text-xs font-medium text-[#64716D]">
            Qiyinlik: {currentQuestion.difficulty}
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-[#17211F] leading-snug">
          {currentQuestion.question_text}
        </h2>

        <div className="grid grid-cols-1 gap-3.5">
          {(['A', 'B', 'C', 'D'] as const).map((letter) => {
            const text = optionsObj[letter];
            if (!text) return null;

            const isChosen = selectedChoice === letter;

            return (
              <button
                key={letter}
                type="button"
                onClick={() => handleSelectOption(letter)}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-4 ${
                  isChosen
                    ? 'bg-[#E6F4F1] border-[#007A63] text-[#005F4F] ring-1 ring-[#007A63]'
                    : 'bg-[#F7FBFA] hover:bg-[#E6F4F1]/50 border-[#D6E5E1] hover:border-[#007A63] text-[#17211F]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 ${
                      isChosen
                        ? 'bg-[#007A63] text-white'
                        : 'bg-white border border-[#D6E5E1] text-[#007A63]'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-sm sm:text-base font-medium">{text}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Navigation Footer */}
        <div className="pt-4 border-t border-[#D6E5E1] flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="px-4 py-2.5 rounded-xl border border-[#D6E5E1] text-xs sm:text-sm font-semibold text-[#17211F] disabled:opacity-40 hover:bg-[#F7FBFA]"
          >
            Oldingi savol
          </button>

          <div className="flex items-center gap-3">
            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                className="px-5 py-2.5 rounded-xl bg-[#007A63] hover:bg-[#005F4F] text-white text-xs sm:text-sm font-semibold flex items-center gap-2"
              >
                <span>Keyingi savol</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}

            <button
              type="button"
              disabled={submittingGame}
              onClick={() => onCompleteGame(answersMap)}
              className="px-5 py-2.5 rounded-xl bg-[#005F4F] hover:bg-[#00463A] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Viktorinani yakunlash ({answeredCount}/{questions.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
