import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Clock,
  CheckCircle2,
  Target,
  Award,
  ArrowLeft,
  BarChart3,
  Play,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import {
  formatSecondsMMSS,
  getStatusBadgeClasses,
  getStatusLabel,
} from '../utils/formatters';
import { GameIcon } from '../components/GameIcon';
import { useI18n } from '../i18n/translations';

export const FinalResultPage: React.FC = () => {
  const { t } = useI18n();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    apiRequest('/results/my-results/')
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div className="h-52 rounded-3xl bg-white border border-[#D6E5E1] animate-pulse" />
        <div className="h-96 rounded-3xl bg-white border border-[#D6E5E1] animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const { summary, games_breakdown, user } = data;
  const isAllDone = summary.completed_games_count >= summary.total_games;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Celebration Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-[#D6E5E1] shadow-elevated overflow-hidden"
      >
        <div className="bg-gradient-to-r from-[#007A63] to-[#005F4F] px-6 sm:px-10 py-8 text-white text-center space-y-2">
          <div className="text-3xl sm:text-4xl">🎉</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Tabriklaymiz, {user.first_name}!
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base font-medium">
            {isAllDone
              ? '“O‘yin yakunlandi” — Barcha 8 ta bosqich bo‘yicha yakuniy natijangiz'
              : `Joriy natijangiz (${summary.completed_games_count} / ${summary.total_games} o‘yin bajarilgan)`}
          </p>
        </div>

        {/* 5 Key Summary Metrics */}
        <div className="p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-[#E6F4F1]/70 border border-[#007A63]/30 text-center">
            <div className="text-xs font-bold text-[#005F4F] uppercase flex items-center justify-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>Umumiy ball</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#007A63] mt-1.5">
              {summary.total_score}{' '}
              <span className="text-xs font-normal text-[#64716D]">
                / {summary.max_possible_score}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1] text-center">
            <div className="text-xs font-bold text-[#64716D] uppercase flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#007A63]" />
              <span>Bajarilgan</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#17211F] mt-1.5">
              {summary.completed_games_count} / {summary.total_games}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1] text-center">
            <div className="text-xs font-bold text-[#64716D] uppercase flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#007A63]" />
              <span>Umumiy vaqt</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#17211F] mt-1.5">
              {formatSecondsMMSS(summary.total_time_spent)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1] text-center">
            <div className="text-xs font-bold text-[#64716D] uppercase flex items-center justify-center gap-1">
              <Target className="w-3.5 h-3.5 text-[#007A63]" />
              <span>Aniqlik</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#17211F] mt-1.5">
              {summary.overall_accuracy}%
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#E6F4F1]/70 border border-[#007A63]/30 text-center col-span-2 sm:col-span-1">
            <div className="text-xs font-bold text-[#005F4F] uppercase flex items-center justify-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>Reyting</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#007A63] mt-1.5">
              #{summary.rank}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 8 Games Breakdown Table */}
      <div className="bg-white rounded-3xl border border-[#D6E5E1] shadow-subtle overflow-hidden">
        <div className="px-6 py-5 border-b border-[#D6E5E1] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#17211F]">
              8 ta o‘yin bo‘yicha batafsil jadval
            </h2>
            <p className="text-xs text-[#64716D]">
              Har bir o‘yindan to‘plangan ball, sarflangan vaqt va yakuniy holat
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7FBFA] border-b border-[#D6E5E1] text-xs font-bold text-[#64716D] uppercase tracking-wider">
                <th className="py-3.5 px-6">O‘yin</th>
                <th className="py-3.5 px-6">Ball</th>
                <th className="py-3.5 px-6">To‘g‘ri / Noto‘g‘ri</th>
                <th className="py-3.5 px-6">Aniqlik</th>
                <th className="py-3.5 px-6">Vaqt</th>
                <th className="py-3.5 px-6 text-right">Natija</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6E5E1]/70 text-sm">
              {games_breakdown.map((g: any) => (
                <tr key={g.game_order} className="hover:bg-[#F7FBFA]/60 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#E6F4F1] text-[#007A63] flex items-center justify-center shrink-0">
                        <GameIcon name={g.icon_name} className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-mono font-bold text-[#64716D]">
                          #{g.game_order}
                        </span>
                        <div className="font-bold text-[#17211F]">{g.game_title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-mono font-extrabold text-[#007A63]">
                    {g.score} / {g.max_score}
                  </td>
                  <td className="py-4 px-6 font-mono text-xs">
                    <span className="text-emerald-700 font-bold">{g.correct_answers} to‘g‘ri</span>
                    {' • '}
                    <span className="text-red-600 font-semibold">{g.wrong_answers} xato</span>
                  </td>
                  <td className="py-4 px-6 font-mono font-semibold text-[#17211F]">
                    {g.accuracy}%
                  </td>
                  <td className="py-4 px-6 font-mono text-[#64716D]">
                    {formatSecondsMMSS(g.time_spent)}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {g.status === 'not_started' ? (
                      <Link
                        to={`/play/${g.game_order}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#007A63] hover:bg-[#005F4F] text-white text-xs font-semibold"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Boshlash</span>
                      </Link>
                    ) : (
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClasses(
                          g.status
                        )}`}
                      >
                        {getStatusLabel(g.status, t)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Action Links */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/dashboard"
          className="px-5 py-3 rounded-xl border border-[#D6E5E1] bg-white hover:bg-[#F7FBFA] text-[#17211F] font-semibold text-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboardga qaytish</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="px-5 py-3 rounded-xl border border-[#007A63] bg-[#E6F4F1] hover:bg-[#D1ECE6] text-[#005F4F] font-bold text-sm flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Natijamni boshqalar bilan taqqoslash</span>
          </Link>
          <Link
            to="/leaderboard"
            className="px-6 py-3 rounded-xl bg-[#007A63] hover:bg-[#005F4F] text-white font-bold text-sm flex items-center gap-2 shadow-sm"
          >
            <Trophy className="w-4 h-4" />
            <span>Umumiy Reyting (Leaderboard)</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
