import React, { useState } from 'react';
import { Cpu, ArrowRight, CheckCheck } from 'lucide-react';
import { InteractiveGameProps } from './QuizGame';

export const DiagramGame: React.FC<InteractiveGameProps> = ({
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

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const opts = currentQ.options || {};
  const diagramType = opts.diagram_type || 'bit_register';
  const choices: string[] = opts.choices || [];
  const selectedVal = answersMap[currentQ.id];

  const handleSelectAnswer = (val: string) => {
    setAnswersMap((prev) => ({ ...prev, [currentQ.id]: val }));
    if (currentIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
      }, 220);
    }
  };

  const answeredCount = Object.keys(answersMap).length;

  return (
    <div className="space-y-6">
      {/* Diagram Task Navigator */}
      <div className="bg-white rounded-2xl border border-[#D6E5E1] p-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {questions.map((q, idx) => {
            const isAnswered = q.id in answersMap;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                  idx === currentIndex
                    ? 'bg-[#007A63] text-white border-[#005F4F] ring-2 ring-[#007A63]/30'
                    : isAnswered
                    ? 'bg-[#E6F4F1] text-[#005F4F] border-[#007A63]'
                    : 'bg-[#F7FBFA] text-[#64716D] border-[#D6E5E1]'
                }`}
              >
                Sxema #{idx + 1}
              </button>
            );
          })}
        </div>
        <span className="text-xs font-bold text-[#007A63]">
          Belgilandi: {answeredCount} / {questions.length}
        </span>
      </div>

      {/* Main Visual Diagram Card */}
      <div className="bg-white rounded-3xl border border-[#D6E5E1] p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4F1] text-[#007A63] text-xs font-bold">
            <Cpu className="w-3.5 h-3.5" />
            <span>{opts.caption || `Vizual Sxema #${currentIndex + 1}`}</span>
          </span>
          <span className="text-xs text-[#64716D] font-medium">
            Qiyinlik: {currentQ.difficulty}
          </span>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-[#17211F]">
          {currentQ.question_text}
        </h2>

        {/* VISUAL SCHEMATIC RENDERER */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1] overflow-x-auto">
          {(diagramType === 'bit_register' || diagramType === 'bit_flip') && (
            <div className="space-y-3 min-w-[480px]">
              <div className="grid grid-cols-8 gap-2 text-center">
                {(opts.weights || [128, 64, 32, 16, 8, 4, 2, 1]).map((w: number, i: number) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (diagramType === 'bit_flip' && choices.includes(String(w))) {
                        handleSelectAnswer(String(w));
                      }
                    }}
                    className={`p-2.5 rounded-xl border transition-all ${
                      diagramType === 'bit_flip' && choices.includes(String(w))
                        ? 'cursor-pointer hover:border-[#007A63]'
                        : ''
                    } ${
                      opts.bits?.[i] === 1
                        ? 'bg-[#007A63] text-white border-[#005F4F] shadow-xs'
                        : 'bg-white text-[#64716D] border-[#D6E5E1]'
                    }`}
                  >
                    <div className="text-[10px] font-mono opacity-80">2^{7 - i}</div>
                    <div className="text-xs font-bold font-mono border-b border-current/20 pb-1 mb-1">
                      Vazn: {w}
                    </div>
                    <div className="text-2xl font-mono font-extrabold">{opts.bits?.[i] ?? 0}</div>
                  </div>
                ))}
              </div>
              <div className="text-center text-xs text-[#64716D] font-mono pt-1">
                Yoqilgan razryadlar (1):{' '}
                {(opts.weights || [])
                  .filter((_: number, idx: number) => opts.bits?.[idx] === 1)
                  .join(' + ')}
              </div>
            </div>
          )}

          {diagramType === 'positional_blocks' && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
              <div className="px-5 py-4 rounded-2xl bg-[#007A63] text-white font-mono font-extrabold text-2xl shadow-sm">
                {opts.number_str}
              </div>
              <span className="text-xl font-bold text-[#007A63]">=</span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {(opts.blocks || []).map((b: any, i: number) => (
                  <div
                    key={i}
                    className={`p-4 rounded-2xl border text-center min-w-[130px] ${
                      String(b.value).includes('?')
                        ? 'bg-[#E6F4F1] border-2 border-[#007A63]'
                        : 'bg-white border-[#D6E5E1]'
                    }`}
                  >
                    <div className="text-xs text-[#64716D]">Raqam: {b.digit}</div>
                    <div className="text-xs font-mono font-semibold text-[#007A63] mt-0.5">
                      Asos: {b.weight}
                    </div>
                    <div className="text-sm font-mono font-extrabold text-[#17211F] mt-1.5">
                      {b.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {diagramType === 'binary_adder' && (
            <div className="max-w-md mx-auto bg-white rounded-2xl border border-[#D6E5E1] p-5 font-mono space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#64716D]">Kirish A:</span>
                <span className="font-extrabold text-[#17211F] text-base">{opts.input_a}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-[#D6E5E1] pb-2">
                <span className="text-[#64716D]">+ Kirish B:</span>
                <span className="font-extrabold text-[#17211F] text-base">{opts.input_b}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-bold text-[#007A63] uppercase">
                  Chiqish Yig‘indi (S):
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#E6F4F1] text-[#005F4F] font-extrabold text-base">
                  [ ? ]₂
                </span>
              </div>
            </div>
          )}

          {diagramType === 'nibble_map' && (
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="p-4 rounded-2xl bg-white border border-[#D6E5E1] text-center space-y-1">
                <div className="text-xs text-[#64716D]">1-Tetrada (Yuqori 4 bit)</div>
                <div className="text-lg font-mono font-extrabold text-[#17211F]">
                  {opts.high_nibble_bits}₂
                </div>
                <div className="text-xs text-[#007A63] font-bold">↓</div>
                <div className="text-xl font-mono font-extrabold text-[#007A63]">
                  {opts.high_nibble_hex}₁₆
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#E6F4F1] border-2 border-[#007A63] text-center space-y-1">
                <div className="text-xs text-[#005F4F] font-semibold">2-Tetrada (Quyi 4 bit)</div>
                <div className="text-lg font-mono font-extrabold text-[#17211F]">
                  {opts.low_nibble_bits}₂
                </div>
                <div className="text-xs text-[#007A63] font-bold">↓</div>
                <div className="text-xl font-mono font-extrabold text-[#005F4F]">[ ? ]₁₆</div>
              </div>
            </div>
          )}

          {diagramType === 'octal_triad' && (
            <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
              {(opts.triads || []).map((tr: any, i: number) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl border text-center space-y-1 ${
                    tr.octal === '?'
                      ? 'bg-[#E6F4F1] border-2 border-[#007A63]'
                      : 'bg-white border-[#D6E5E1]'
                  }`}
                >
                  <div className="text-[11px] text-[#64716D]">{i + 1}-Triada (3 bit)</div>
                  <div className="text-base font-mono font-extrabold text-[#17211F]">
                    {tr.bits}₂
                  </div>
                  <div className="text-xs text-[#007A63]">↓</div>
                  <div className="text-lg font-mono font-extrabold text-[#007A63]">
                    {tr.octal === '?' ? '[ ? ]₈' : `${tr.octal}₈`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Answer Choice Buttons */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-[#64716D] uppercase">
            To‘g‘ri javobni tanlang (natija o‘yin yakunida tekshiriladi):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {choices.map((chVal) => {
              const isChosen = selectedVal === chVal;
              return (
                <button
                  key={chVal}
                  type="button"
                  onClick={() => handleSelectAnswer(chVal)}
                  className={`py-3.5 px-4 rounded-2xl border font-mono font-extrabold text-base transition-all flex items-center justify-center gap-2 ${
                    isChosen
                      ? 'bg-[#007A63] border-[#005F4F] text-white shadow-sm'
                      : 'bg-[#F7FBFA] hover:bg-[#E6F4F1] border-[#D6E5E1] hover:border-[#007A63] text-[#17211F]'
                  }`}
                >
                  <span>{chVal}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-[#D6E5E1] flex items-center justify-between">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="px-4 py-2.5 rounded-xl border border-[#D6E5E1] text-xs sm:text-sm font-semibold text-[#17211F] disabled:opacity-40"
          >
            Oldingi sxema
          </button>

          <div className="flex items-center gap-3">
            {currentIndex < questions.length - 1 && (
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="px-5 py-2.5 rounded-xl bg-[#007A63] hover:bg-[#005F4F] text-white text-xs sm:text-sm font-semibold flex items-center gap-2"
              >
                <span>Keyingi sxema</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              disabled={submittingGame}
              onClick={() => onCompleteGame(answersMap)}
              className="px-5 py-2.5 rounded-xl bg-[#005F4F] hover:bg-[#00463A] text-white text-xs sm:text-sm font-bold flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              <span>O‘yinni yakunlash ({answeredCount}/{questions.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
