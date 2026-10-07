import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  Trophy,
  Play,
  Lock,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { DashboardData, GameItem } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n/translations';
import {
  formatSecondsMMSS,
  getStatusBadgeClasses,
  getStatusLabel,
} from '../utils/formatters';
import { GameIcon } from '../components/GameIcon';

export const DashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [liveRemaining, setLiveRemaining] = useState<number>(3000);
  const [selectedGameForModal, setSelectedGameForModal] = useState<GameItem | null>(null);
  const [startingGame, setStartingGame] = useState<boolean>(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await apiRequest<DashboardData>('/games/dashboard/');
      if (!res.stats.rules_accepted) {
        navigate('/rules', { replace: true });
        return;
      }
      setData(res);
      setLiveRemaining(res.global_timer.remaining_seconds);
      setError(null);
    } catch (err: any) {
      setError(err?.message || t('serverError'));
    } finally {
      setLoading(false);
    }
  }, [navigate, t]);

  useEffect(() => {
    fetchDashboard();
    refreshUser();
  }, [fetchDashboard, refreshUser]);

  // Live 1-second countdown for CARD 1 (Global Timer)
  useEffect(() => {
    if (!data?.global_timer.started_at || data.global_timer.is_completed) return;

    const startMs = new Date(data.global_timer.started_at).getTime();
    const budget = data.global_timer.budget_seconds || 3000;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      const rem = Math.max(0, budget - elapsed);
      setLiveRemaining(rem);
      if (rem === 0) {
        clearInterval(interval);
        fetchDashboard();
        navigate('/final-result');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [data, fetchDashboard, navigate]);

  const handleConfirmStartGame = async () => {
    if (!selectedGameForModal || startingGame) return;
    setStartingGame(true);
    try {
      navigate(`/play/${selectedGameForModal.order}`);
    } finally {
      setStartingGame(false);
      setSelectedGameForModal(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-36 rounded-2xl bg-white border border-[#D6E5E1] p-6 animate-pulse flex flex-col justify-between"
            >
              <div className="h-4 w-28 bg-slate-200 rounded" />
              <div className="h-8 w-24 bg-slate-200 rounded" />
              <div className="h-2.5 w-full bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="h-72 rounded-2xl bg-white border border-[#D6E5E1] p-6 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 bg-slate-200 rounded-xl" />
                <div className="h-5 w-36 bg-slate-200 rounded" />
                <div className="h-12 w-full bg-slate-100 rounded" />
              </div>
              <div className="h-10 w-full bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-[#D6E5E1] p-8 shadow-subtle space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-[#17211F]">{error || t('serverError')}</h2>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchDashboard();
            }}
            className="px-6 py-2.5 rounded-xl bg-[#007A63] text-white font-semibold text-sm hover:bg-[#005F4F]"
          >
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  const budgetSeconds = data.global_timer.budget_seconds || 3000;
  const timePercent = Math.max(0, Math.min(100, (liveRemaining / budgetSeconds) * 100));
  const completedCount = data.stats.completed_games;
  const totalGames = data.stats.total_games || 8;
  const completedPercent = Math.max(0, Math.min(100, (completedCount / totalGames) * 100));
  const totalScore = data.stats.total_score;
  const maxPossibleScore = data.stats.max_possible_score || 867;
  const scorePercent = Math.max(0, Math.min(100, (totalScore / maxPossibleScore) * 100));

  const allCompleted = completedCount >= totalGames;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Topic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#007A63]">
            Mavzu: Kompyuterda sonlarni tasvirlash va qayta ishlash • Sanoq sistemalari
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17211F] mt-1">
            Xush kelibsiz, {user?.first_name} {user?.last_name}!
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/leaderboard"
            className="px-4 py-2.5 rounded-xl bg-white border border-[#D6E5E1] hover:border-[#007A63] text-sm font-semibold text-[#17211F] flex items-center gap-2 shadow-subtle transition-all"
          >
            <Trophy className="w-4 h-4 text-[#007A63]" />
            <span>Reyting jadvali</span>
          </Link>
          <Link
            to="/final-result"
            className="px-4 py-2.5 rounded-xl bg-[#007A63] hover:bg-[#005F4F] text-sm font-semibold text-white flex items-center gap-2 shadow-sm transition-all"
          >
            <span>Yakuniy natijam</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* All Games Completed Celebration Banner */}
      {allCompleted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#007A63] to-[#005F4F] rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-elevated"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">{t('allGamesDone')} 🎉</h2>
              <p className="text-emerald-50/90 text-sm">
                Siz barcha 8 ta interaktiv o‘yinni yakunladingiz va jami {totalScore} /{' '}
                {maxPossibleScore} ball to‘pladingiz.
              </p>
            </div>
          </div>
          <Link
            to="/final-result"
            className="px-5 py-2.5 rounded-xl bg-white text-[#005F4F] font-bold text-sm hover:bg-emerald-50 transition-colors shrink-0 text-center"
          >
            Batafsil natijani ko‘rish
          </Link>
        </motion.div>
      )}

      {/* TOP 3 STATISTIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: Umumiy vaqt */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl border border-[#D6E5E1] p-6 shadow-subtle flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#64716D]">{t('totalTime')}</span>
            <div className="w-10 h-10 rounded-xl bg-[#E6F4F1] text-[#007A63] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#17211F]">
              {formatSecondsMMSS(liveRemaining)}
            </span>
            <span className="text-xs font-medium text-[#64716D]">
              {formatSecondsMMSS(budgetSeconds)} dan
            </span>
          </div>
          <div>
            <div className="w-full h-2.5 bg-[#F0F6F4] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  liveRemaining <= 300 ? 'bg-red-500' : 'bg-[#007A63]'
                }`}
                style={{ width: `${timePercent}%` }}
              />
            </div>
            <div className="text-[11px] text-[#64716D] mt-1.5 flex justify-between">
              <span>
                {data.global_timer.started_at
                  ? 'Timer faol holatda'
                  : 'Birinchi o‘yin bilan boshlanadi'}
              </span>
              <span>{Math.round(timePercent)}%</span>
            </div>
          </div>
        </motion.div>

        {/* CARD 2: Yakunlangan */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white rounded-2xl border border-[#D6E5E1] p-6 shadow-subtle flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#64716D]">{t('completed')}</span>
            <div className="w-10 h-10 rounded-xl bg-[#E6F4F1] text-[#007A63] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#17211F]">
              {completedCount}/{totalGames}
            </span>
            <span className="text-xs font-medium text-[#64716D]">{totalGames} o‘yindan</span>
          </div>
          <div>
            <div className="w-full h-2.5 bg-[#F0F6F4] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#007A63] rounded-full transition-all duration-500"
                style={{ width: `${completedPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-[#64716D] mt-1.5 flex justify-between">
              <span>Har bir o‘yin 1 marta bajariladi</span>
              <span>{Math.round(completedPercent)}%</span>
            </div>
          </div>
        </motion.div>

        {/* CARD 3: Umumiy ball */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-2xl border border-[#D6E5E1] p-6 shadow-subtle flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#64716D]">{t('totalScore')}</span>
            <div className="w-10 h-10 rounded-xl bg-[#E6F4F1] text-[#007A63] flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#007A63]">
              {totalScore}
            </span>
            <span className="text-xs font-medium text-[#64716D]">
              / {maxPossibleScore} (barcha 8 o‘yindan yig‘ilgan ball)
            </span>
          </div>
          <div>
            <div className="w-full h-2.5 bg-[#F0F6F4] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#007A63] rounded-full transition-all duration-500"
                style={{ width: `${scorePercent}%` }}
              />
            </div>
            <div className="text-[11px] text-[#64716D] mt-1.5 flex justify-between">
              <span>Jami maksimal: {maxPossibleScore} ball</span>
              <span>{Math.round(scorePercent)}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 8 INTERACTIVE GAMES GRID (Desktop: 4+4, Tablet: 2, Mobile: 1) */}
      <div id="games-grid-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#17211F]">Interaktiv O‘yinlar (8 ta bosqich)</h2>
            <p className="text-xs sm:text-sm text-[#64716D]">
              Istalgan o‘yinni tanlab bilimingizni sinang. Tugallangan o‘yinlar qayta ochilmaydi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {data.games.map((game, idx) => {
            const isFinished =
              game.user_status === 'completed' ||
              game.user_status === 'time_expired' ||
              game.user_status === 'violation';
            const isInProgress = game.user_status === 'in_progress';
            const canPlay =
              !isFinished && !data.global_timer.is_expired;

            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                whileHover={{ y: -3 }}
                className={`bg-white rounded-2xl border ${
                  isInProgress
                    ? 'border-blue-300 ring-2 ring-blue-100'
                    : isFinished
                    ? 'border-[#D6E5E1] bg-white/95'
                    : 'border-[#D6E5E1] hover:border-[#007A63]/60'
                } p-5 shadow-subtle hover:shadow-elevated transition-all flex flex-col justify-between`}
              >
                <div>
                  {/* Card Top Row: #Order + Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isFinished
                            ? 'bg-emerald-50 text-[#007A63]'
                            : 'bg-[#E6F4F1] text-[#007A63]'
                        }`}
                      >
                        <GameIcon name={game.icon_name} className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-[#F7FBFA] border border-[#D6E5E1] text-[#17211F] font-mono">
                        #{game.order}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadgeClasses(
                        game.user_status
                      )}`}
                    >
                      {getStatusLabel(game.user_status, t)}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-[#17211F] mb-1.5">{game.title}</h3>
                  <p className="text-xs text-[#64716D] leading-relaxed line-clamp-3 mb-4">
                    {game.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-[#D6E5E1]/70">
                  {/* Meta Info: Time & Max Score */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#F7FBFA] rounded-xl p-2.5 border border-[#D6E5E1]/60">
                      <div className="text-[#64716D] text-[11px]">{t('timeLabel')}:</div>
                      <div className="font-bold text-[#17211F] mt-0.5">
                        {game.duration_minutes} daqiqa
                      </div>
                    </div>
                    <div className="bg-[#F7FBFA] rounded-xl p-2.5 border border-[#D6E5E1]/60">
                      <div className="text-[#64716D] text-[11px]">{t('maxScoreLabel')}:</div>
                      <div className="font-bold text-[#007A63] mt-0.5">{game.max_score} ball</div>
                    </div>
                  </div>

                  {/* Action / Result Footer */}
                  {isFinished && game.user_result ? (
                    <div className="rounded-xl bg-[#E6F4F1]/60 border border-[#007A63]/25 p-3 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-[#005F4F]">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#007A63]" />
                          <span>{getStatusLabel(game.user_status, t)}</span>
                        </span>
                        <span className="font-mono text-sm">
                          {game.user_result.score} / {game.max_score}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#64716D]">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {t('noRetryLabel')}
                        </span>
                        <span>
                          {formatSecondsMMSS(game.user_result.time_spent)} •{' '}
                          {game.user_result.accuracy}%
                        </span>
                      </div>
                    </div>
                  ) : canPlay ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (isInProgress) {
                          navigate(`/play/${game.order}`);
                        } else {
                          setSelectedGameForModal(game);
                        }
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                        isInProgress
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-[#007A63] hover:bg-[#005F4F] text-white'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{isInProgress ? t('continueBtn') : t('startBtn')}</span>
                    </button>
                  ) : (
                    <div className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Vaqt tugagan</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* START GAME CONFIRMATION MODAL (Section 28) */}
      <AnimatePresence>
        {selectedGameForModal && (
          <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-[#D6E5E1] shadow-elevated max-w-md w-full p-6 sm:p-8 space-y-5"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#E6F4F1] text-[#007A63] flex items-center justify-center shrink-0">
                  <GameIcon name={selectedGameForModal.icon_name} className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#007A63] uppercase">
                    O‘yin #{selectedGameForModal.order}
                  </span>
                  <h3 className="text-lg font-extrabold text-[#17211F]">
                    {selectedGameForModal.title}ni boshlashga tayyormisiz?
                  </h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1] space-y-2 text-xs sm:text-sm text-[#64716D]">
                <p className="font-semibold text-[#17211F]">
                  Ushbu o‘yinni faqat bir marta bajarishingiz mumkin.
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-[#D6E5E1]/70">
                  <span>Ajratilgan vaqt:</span>
                  <span className="font-bold text-[#17211F]">
                    {selectedGameForModal.duration_minutes} daqiqa
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Maksimal ball:</span>
                  <span className="font-bold text-[#007A63]">
                    {selectedGameForModal.max_score} ball
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  disabled={startingGame}
                  onClick={() => setSelectedGameForModal(null)}
                  className="py-3 px-4 rounded-xl border border-[#D6E5E1] bg-white hover:bg-[#F7FBFA] text-[#17211F] font-semibold text-sm transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  disabled={startingGame}
                  onClick={handleConfirmStartGame}
                  className="py-3 px-4 rounded-xl bg-[#007A63] hover:bg-[#005F4F] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  {startingGame ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  <span>Boshlash</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
