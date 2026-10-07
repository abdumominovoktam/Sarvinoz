import React, { useState } from 'react';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  CheckCheck,
  ArrowRight,
} from 'lucide-react';
import { InteractiveGameProps } from './QuizGame';

export const ProcessChainGame: React.FC<InteractiveGameProps> = ({
  questions,
  savedAnswers,
  onCompleteGame,
  submittingGame,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stepsMap, setStepsMap] = useState<Record<number, string[]>>(() => {
    const init: Record<number, string[]> = {};
    for (const q of questions) {
      const saved = savedAnswers[q.id]?.submitted_answer;
      if (Array.isArray(saved) && saved.length > 0) {
        init[q.id] = saved.map(String);
      } else {
        init[q.id] = (q.options?.shuffled_steps || []).map(String);
      }
    }
    return init;
  });

  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const currentSteps = stepsMap[currentQ.id] || [];

  const moveStep = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= currentSteps.length) return;
    const copy = [...currentSteps];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    setStepsMap((prev) => ({ ...prev, [currentQ.id]: copy }));
  };

  return (
    <div className="space-y-6">
      {/* Chain Selector Pills */}
      <div className="bg-white rounded-2xl border border-[#D6E5E1] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                idx === currentIndex
                  ? 'bg-[#007A63] text-white border-[#005F4F]'
                  : 'bg-[#F7FBFA] text-[#64716D] border-[#D6E5E1] hover:border-[#007A63]'
              }`}
            >
              Jarayon #{idx + 1}
            </button>
          ))}
        </div>
        <span className="text-xs font-bold text-[#007A63]">
          Jarayon: {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Main Chain Reordering Card */}
      <div className="bg-white rounded-3xl border border-[#D6E5E1] p-6 sm:p-8 shadow-subtle space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#007A63]">
            Algoritmik ketma-ketlik #{currentIndex + 1}
          </span>
          <h2 className="text-base sm:text-lg font-bold text-[#17211F] mt-1">
            {currentQ.question_text}
          </h2>
          <p className="text-xs text-[#64716D] mt-1">
            Bosqichlarni sichqoncha bilan surib (Drag & Drop) yoki strelkalar yordamida 1-qadamdan
            oxirgi qadamgacha to‘g‘ri tartibga qo‘ying. Natijalar o‘yin yakunida tekshiriladi.
          </p>
        </div>

        {/* Draggable Step Items */}
        <div className="space-y-2.5">
          {currentSteps.map((stepText, idx) => (
            <div
              key={`${idx}-${stepText.slice(0, 15)}`}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx !== null && dragIdx !== idx) {
                  moveStep(dragIdx, idx);
                }
                setDragIdx(null);
              }}
              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                dragIdx === idx
                  ? 'bg-[#E6F4F1] border-[#007A63] opacity-70'
                  : 'bg-[#F7FBFA] hover:bg-white border-[#D6E5E1] hover:border-[#007A63]/60 cursor-grab active:cursor-grabbing'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <GripVertical className="w-4 h-4 text-[#64716D] shrink-0 hidden sm:block" />
                <span className="w-8 h-8 rounded-xl font-mono font-extrabold text-xs flex items-center justify-center shrink-0 bg-[#007A63] text-white">
                  {idx + 1}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-[#17211F]">
                  {stepText}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveStep(idx, idx - 1)}
                  className="p-1.5 rounded-lg border border-[#D6E5E1] bg-white hover:bg-[#E6F4F1] text-[#17211F] disabled:opacity-30"
                  title="Yuqoriga ko‘tarish"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === currentSteps.length - 1}
                  onClick={() => moveStep(idx, idx + 1)}
                  className="p-1.5 rounded-lg border border-[#D6E5E1] bg-white hover:bg-[#E6F4F1] text-[#17211F] disabled:opacity-30"
                  title="Pastga tushirish"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Controls Footer */}
        <div className="pt-4 border-t border-[#D6E5E1] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="px-4 py-2.5 rounded-xl border border-[#D6E5E1] hover:bg-[#F7FBFA] text-xs sm:text-sm font-semibold text-[#17211F] disabled:opacity-40"
          >
            Oldingi jarayon
          </button>

          <div className="flex items-center gap-3">
            {currentIndex < questions.length - 1 && (
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="px-4 py-2.5 rounded-xl bg-[#007A63] hover:bg-[#005F4F] text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5"
              >
                <span>Keyingi jarayon</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              disabled={submittingGame}
              onClick={() => onCompleteGame(stepsMap)}
              className="px-5 py-2.5 rounded-xl bg-[#005F4F] hover:bg-[#00463A] text-white text-xs sm:text-sm font-bold flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Yakunlash va tekshirish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
