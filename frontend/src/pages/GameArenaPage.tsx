import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  AlertTriangle,
  Trophy,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { GameResultSummary, GameSessionPayload } from '../types';
import { formatSecondsMMSS, getStatusLabel } from '../utils/formatters';
import { useAntiCheat, ViolationResponse } from '../hooks/useAntiCheat';
import { useAuth } from '../hooks/useAuth';
import { QuizGame } from '../games/QuizGame';
import { CrosswordGame } from '../games/CrosswordGame';
import { WordSearchGame } from '../games/WordSearchGame';
import { ScrambleGame } from '../games/ScrambleGame';
import { ProcessChainGame } from '../games/ProcessChainGame';
import { MatchingGame } from '../games/MatchingGame';
import { BingoGame } from '../games/BingoGame';
import { DiagramGame } from '../games/DiagramGame';

export const GameArenaPage: React.FC = () => {
  const { order } = useParams<{ order: string }>();
  const gameOrder = Number(order || 1);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [sessionPayload, setSessionPayload] = useState<GameSessionPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [gameRemaining, setGameRemaining] = useState<number>(300);
  const [submittingGame, setSubmittingGame] = useState<boolean>(false);

  // Modals state
  const [finishedResult, setFinishedResult] = useState<GameResultSummary | null>(null);
  const [allGamesCompleted, setAllGamesCompleted] = useState<boolean>(false);
  const [exitModalOpen, setExitModalOpen] = useState<boolean>(false);
  const [violationWarning, setViolationWarning] = useState<ViolationResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initGame = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiRequest<GameSessionPayload>(`/games/${gameOrder}/start/`, {
          method: 'POST',
        });
        if (cancelled) return;
        setSessionPayload(res);
        setGameRemaining(res.session.remaining_seconds);
        refreshUser();
      } catch (err: any) {
        if (cancelled) return;
        if (err?.data?.result) {
          setFinishedResult(err.data.result);
        } else {
          setError(err?.message || 'O‘yinni yuklashda xatolik yuz berdi.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initGame();

    return () => {
      cancelled = true;
    };
  }, [gameOrder, refreshUser]);

  const handleCompleteGame = useCallback(
    async (finalAnswersMap: Record<number, any> = {}) => {
      if (submittingGame || finishedResult) return;
      setSubmittingGame(true);
      try {
        const res = await apiRequest<{
          message: string;
          all_games_completed: boolean;
          result: GameResultSummary;
        }>(`/games/${gameOrder}/submit/`, {
          method: 'POST',
          body: JSON.stringify({ answers: finalAnswersMap }),
        });
        setFinishedResult(res.result);
        setAllGamesCompleted(Boolean(res.all_games_completed));
        refreshUser();
      } catch (err: any) {
        if (err?.data?.result) {
          setFinishedResult(err.data.result);
        } else {
          setError(err?.message || 'Natijani saqlashda xatolik yuz berdi.');
        }
      } finally {
        setSubmittingGame(false);
      }
    },
    [gameOrder, submittingGame, finishedResult, refreshUser]
  );

  // Per-game countdown timer synchronized with server expires_at
  useEffect(() => {
    if (!sessionPayload || finishedResult) return;

    const expiresMs = new Date(sessionPayload.session.expires_at).getTime();
    const timer = setInterval(() => {
      const rem = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
      setGameRemaining(rem);
      if (rem <= 0) {
        clearInterval(timer);
        handleCompleteGame({});
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionPayload, finishedResult, handleCompleteGame]);

  // Listen for Navbar exit request while game is active
  useEffect(() => {
    const onRequestExit = () => {
      if (!finishedResult) {
        setExitModalOpen(true);
      }
    };
    window.addEventListener('sarvinoz:request-exit-game', onRequestExit);
    return () => window.removeEventListener('sarvinoz:request-exit-game', onRequestExit);
  }, [finishedResult]);

  // Anti-Cheat Hook (1 violation = immediate termination with 0 points)
  useAntiCheat({
    enabled: Boolean(sessionPayload && !finishedResult && !loading),
    gameOrder,
    onWarning: (info) => {
      setViolationWarning(info);
    },
    onTerminated: (info) => {
      setViolationWarning(info);
      if (info.result) {
        setFinishedResult(info.result);
        refreshUser();
      }
    },
  });

  const handleRecordSingleAnswer = async (questionId: number, answerValue: any) => {
    return await apiRequest<{
      question_id: number;
      is_correct: boolean;
      correct_answer: any;
      explanation: string;
    }>(`/games/${gameOrder}/answer/`, {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        answer: answerValue,
      }),
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
        <div className="h-16 rounded-2xl bg-white border border-[#D6E5E1] animate-pulse p-5" />
        <div className="h-[520px] rounded-3xl bg-white border border-[#D6E5E1] animate-pulse p-8" />
      </div>
    );
  }

  if (error && !finishedResult) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-[#D6E5E1] p-8 shadow-subtle space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-[#17211F]">{error}</h2>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded-xl bg-[#007A63] text-white font-semibold text-sm hover:bg-[#005F4F]"
          >
            Dashboardga qaytish
          </button>
        </div>
      </div>
    );
  }

  const game = sessionPayload?.game;
  const durationSec = game?.duration_seconds || 300;
  const timeProgress = Math.max(0, Math.min(100, (gameRemaining / durationSec) * 100));

  const sharedProps = {
    gameOrder,
    questions: sessionPayload?.questions || [],
    sessionData: sessionPayload?.session.session_data || {},
    savedAnswers: sessionPayload?.saved_answers || {},
    onRecordAnswer: handleRecordSingleAnswer,
    onCompleteGame: handleCompleteGame,
    submittingGame,
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Top Game Arena Bar (Matches Reference Screenshots) */}
      {game && (
        <div className="bg-white rounded-2xl border border-[#D6E5E1] px-4 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setExitModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl border border-[#D6E5E1] bg-white hover:bg-[#F7FBFA] text-[#17211F] text-sm font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#17211F]" />
              <span>Chiqish</span>
            </button>

            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-[#17211F]">
                {game.title}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F0F6F4] border border-[#D6E5E1] text-xs font-mono text-[#64716D]">
                #{game.slug}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 font-mono font-extrabold text-base ${
                gameRemaining <= 60 ? 'text-red-600 animate-pulse' : 'text-[#17211F]'
              }`}
            >
              <Clock className="w-4 h-4 text-[#64716D]" />
              <span>{formatSecondsMMSS(gameRemaining)}</span>
            </div>

            <div className="w-24 sm:w-28 h-2.5 bg-[#E6F0ED] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  gameRemaining <= 60 ? 'bg-red-500' : 'bg-[#007A63]'
                }`}
                style={{ width: `${timeProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Render Specific Game Component */}
      {sessionPayload && !finishedResult && (
        <div>
          {game?.game_type === 'quiz' && <QuizGame {...sharedProps} />}
          {game?.game_type === 'crossword' && <CrosswordGame {...sharedProps} />}
          {game?.game_type === 'word_search' && <WordSearchGame {...sharedProps} />}
          {game?.game_type === 'scramble' && <ScrambleGame {...sharedProps} />}
          {game?.game_type === 'process_chain' && <ProcessChainGame {...sharedProps} />}
          {game?.game_type === 'matching' && <MatchingGame {...sharedProps} />}
          {game?.game_type === 'bingo' && <BingoGame {...sharedProps} />}
          {game?.game_type === 'diagram' && <DiagramGame {...sharedProps} />}
        </div>
      )}

      {/* PROTECTED EXIT CONFIRMATION MODAL */}
      <AnimatePresence>
        {exitModalOpen && !finishedResult && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-[#D6E5E1] shadow-elevated max-w-md w-full p-6 sm:p-8 space-y-5"
            >
              <div className="flex items-center gap-3 text-amber-600">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#17211F]">
                    O‘yinni tark etmoqchimisiz?
                  </h3>
                  <p className="text-xs text-[#64716D]">Diqqat bilan tasdiqlang</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs sm:text-sm text-amber-950 font-medium">
                O‘yinni tark etsangiz, qayta kira olmaysiz. Hozirgacha belgilagan javoblaringiz
                asosida yakuniy ball hisoblanadi va o‘yin yopiladi.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExitModalOpen(false)}
                  className="py-3 px-4 rounded-xl border border-[#D6E5E1] bg-white hover:bg-[#F7FBFA] text-[#17211F] font-semibold text-sm"
                >
                  O‘yinda qolish
                </button>
                <button
                  type="button"
                  disabled={submittingGame}
                  onClick={() => {
                    setExitModalOpen(false);
                    handleCompleteGame({});
                  }}
                  className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm"
                >
                  Yakunlash va chiqish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GAME COMPLETION / VIOLATION RESULT MODAL */}
      <AnimatePresence>
        {finishedResult && (
          <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl border border-[#D6E5E1] shadow-elevated max-w-lg w-full p-6 sm:p-8 space-y-6 text-center"
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-xs ${
                  finishedResult.status === 'violation'
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-[#E6F4F1] text-[#007A63]'
                }`}
              >
                {finishedResult.status === 'violation' ? (
                  <ShieldAlert className="w-8 h-8" />
                ) : (
                  <Trophy className="w-8 h-8" />
                )}
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-[#17211F]">
                  {finishedResult.status === 'violation'
                    ? '🚫 Qoidabuzarlik aniqlandi!'
                    : finishedResult.status === 'time_expired'
                    ? '⏰ Vaqt tugadi! O‘yin yakunlandi'
                    : '🎉 O‘yin tugadi!'}
                </h2>
                <p className="text-sm text-[#64716D] mt-1">
                  {finishedResult.status === 'violation'
                    ? violationWarning?.message ||
                      'Siz boshqa oyna yoki tabga o‘tganingiz sababli ushbu topshiriq bekor qilindi va 0 ball berildi.'
                    : `${finishedResult.game_title || game?.title} — Natijangiz:`}
                </p>
              </div>

              {/* Score Highlight */}
              <div
                className={`p-5 rounded-2xl border space-y-1 ${
                  finishedResult.status === 'violation'
                    ? 'bg-red-50/60 border-red-200'
                    : 'bg-[#F7FBFA] border-[#D6E5E1]'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-[#64716D]">
                  To‘plangan Ball
                </div>
                <div
                  className={`text-4xl font-extrabold font-mono ${
                    finishedResult.status === 'violation' ? 'text-red-600' : 'text-[#007A63]'
                  }`}
                >
                  {finishedResult.score}{' '}
                  <span className="text-lg text-[#64716D] font-normal">
                    / {finishedResult.max_score}
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#64716D] pt-1">
                  Holat: {getStatusLabel(finishedResult.status)}
                </div>
              </div>

              {/* 4 Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>To‘g‘ri:</span>
                  </div>
                  <div className="text-xl font-extrabold font-mono text-emerald-900 mt-1">
                    {finishedResult.correct_answers}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200">
                  <div className="text-[11px] text-red-700 font-semibold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Noto‘g‘ri:</span>
                  </div>
                  <div className="text-xl font-extrabold font-mono text-red-900 mt-1">
                    {finishedResult.wrong_answers}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1]">
                  <div className="text-[11px] text-[#64716D] font-semibold">Vaqt:</div>
                  <div className="text-xl font-extrabold font-mono text-[#17211F] mt-1">
                    {formatSecondsMMSS(finishedResult.time_spent)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1]">
                  <div className="text-[11px] text-[#64716D] font-semibold">Aniqlik:</div>
                  <div className="text-xl font-extrabold font-mono text-[#007A63] mt-1">
                    {finishedResult.accuracy}%
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 py-3.5 px-5 rounded-xl bg-[#007A63] hover:bg-[#005F4F] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Dashboardga qaytish</span>
                </button>
                {allGamesCompleted && (
                  <button
                    type="button"
                    onClick={() => navigate('/final-result')}
                    className="flex-1 py-3.5 px-5 rounded-xl bg-[#005F4F] hover:bg-[#00463A] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Yakuniy natijani ko‘rish</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
