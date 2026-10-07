import React, { useEffect, useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Users,
  Trophy,
  Clock,
  Target,
  CheckCircle2,
  BarChart3,
  Award,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import {
  formatSecondsMMSS,
  getStatusBadgeClasses,
  getStatusLabel,
} from '../utils/formatters';
import { useI18n } from '../i18n/translations';
import { GameIcon } from '../components/GameIcon';

export const ProfilePage: React.FC = () => {
  const { t } = useI18n();
  const [profileData, setProfileData] = useState<any>(null);
  const [compareData, setCompareData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      apiRequest('/results/my-results/'),
      apiRequest('/results/comparison/'),
    ])
      .then(([pRes, cRes]) => {
        setProfileData(pRes);
        setCompareData(cRes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
        <div className="h-44 rounded-3xl bg-white border border-[#D6E5E1] animate-pulse" />
        <div className="h-80 rounded-3xl bg-white border border-[#D6E5E1] animate-pulse" />
      </div>
    );
  }

  if (!profileData) return null;

  const { user, summary, games_breakdown } = profileData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Identity & Core Metrics Card */}
      <div className="bg-white rounded-3xl border border-[#D6E5E1] shadow-subtle p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#D6E5E1]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#007A63] text-white font-extrabold text-2xl flex items-center justify-center shadow-sm">
              {user.first_name?.[0]}
              {user.last_name?.[0]}
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E6F4F1] text-[#007A63] text-xs font-bold">
                Profil / Mening natijalarim
              </span>
              <h1 className="text-2xl font-extrabold text-[#17211F] mt-1">
                {user.first_name} {user.last_name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#64716D] mt-1">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#007A63]" />
                  <span>
                    Guruh: <strong className="text-[#17211F]">{user.group_name}</strong>
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#007A63]" />
                  <span>{user.email}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-[#E6F4F1] border border-[#007A63]/30 text-center">
              <div className="text-[11px] font-bold text-[#005F4F] uppercase">Umumiy Reyting</div>
              <div className="text-2xl font-extrabold font-mono text-[#007A63]">
                #{summary.rank}{' '}
                <span className="text-xs font-normal text-[#64716D]">
                  / {summary.total_participants}
                </span>
              </div>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1] text-center">
              <div className="text-[11px] font-bold text-[#64716D] uppercase">Guruhda O‘rin</div>
              <div className="text-2xl font-extrabold font-mono text-[#17211F]">
                #{summary.group_rank}{' '}
                <span className="text-xs font-normal text-[#64716D]">
                  / {summary.group_participants}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Personal Statistic KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1]">
            <div className="text-xs text-[#64716D] font-semibold">Umumiy ball</div>
            <div className="text-xl font-extrabold font-mono text-[#007A63] mt-1">
              {summary.total_score} / {summary.max_possible_score}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1]">
            <div className="text-xs text-[#64716D] font-semibold">Bajarilgan o‘yinlar</div>
            <div className="text-xl font-extrabold font-mono text-[#17211F] mt-1">
              {summary.completed_games_count} / {summary.total_games}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1]">
            <div className="text-xs text-[#64716D] font-semibold">Umumiy vaqt</div>
            <div className="text-xl font-extrabold font-mono text-[#17211F] mt-1">
              {formatSecondsMMSS(summary.total_time_spent)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1]">
            <div className="text-xs text-[#64716D] font-semibold">O‘rtacha vaqt</div>
            <div className="text-xl font-extrabold font-mono text-[#17211F] mt-1">
              {formatSecondsMMSS(Math.round(summary.average_time_per_game))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1]">
            <div className="text-xs text-[#64716D] font-semibold">Aniqlik</div>
            <div className="text-xl font-extrabold font-mono text-[#007A63] mt-1">
              {summary.overall_accuracy}%
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1]">
            <div className="text-xs text-[#64716D] font-semibold">To‘g‘ri / Xato</div>
            <div className="text-xl font-extrabold font-mono text-[#17211F] mt-1">
              <span className="text-emerald-600">{summary.total_correct}</span> /{' '}
              <span className="text-red-500">{summary.total_wrong}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Progress Chart & Comparison Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Progress Chart by Game */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#D6E5E1] p-6 sm:p-8 shadow-subtle space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-[#17211F] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#007A63]" />
                <span>O‘yinlar bo‘yicha o‘zlashtirish grafigi</span>
              </h2>
              <p className="text-xs text-[#64716D]">
                Har bir o‘yinda maksimal ballga nisbatan natijangiz (%)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {games_breakdown.map((g: any) => {
              const pct = Math.min(100, Math.round((g.score / (g.max_score || 1)) * 100));
              return (
                <div key={g.game_order} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#17211F]">
                      #{g.game_order} {g.game_title}
                    </span>
                    <span className="font-mono font-bold text-[#007A63]">
                      {g.score} / {g.max_score} ball ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-[#F0F6F4] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#007A63] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comparison with Group & Platform (Section 14) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#D6E5E1] p-6 sm:p-8 shadow-subtle flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-extrabold text-[#17211F] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#007A63]" />
                <span>Natijamni taqqoslash</span>
              </h2>
              <p className="text-xs text-[#64716D]">
                Sizning ko‘rsatkichingiz guruh va platforma o‘rtachasi bilan solishtirilganda
              </p>
            </div>

            {compareData && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#E6F4F1]/70 border border-[#007A63]/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#005F4F] uppercase">Sizning ballingiz</div>
                    <div className="text-xs text-[#64716D]">
                      Reyting: #{compareData.my_stats.rank} • Guruhda: #{compareData.my_stats.group_rank}
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-[#007A63]">
                    {compareData.my_stats.total_score} ball
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#17211F] uppercase">
                      Guruh o‘rtachasi ({compareData.group_comparison.group_name})
                    </div>
                    <div className="text-xs text-[#64716D]">
                      O‘rtacha vaqt:{' '}
                      {formatSecondsMMSS(
                        Math.round(compareData.group_comparison.average_time_spent)
                      )}
                    </div>
                  </div>
                  <div className="text-xl font-extrabold font-mono text-[#17211F]">
                    {compareData.group_comparison.average_score} ball
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#17211F] uppercase">
                      Platforma o‘rtachasi
                    </div>
                    <div className="text-xs text-[#64716D]">
                      Eng yuqori ball: {compareData.platform_comparison.top_score} ball
                    </div>
                  </div>
                  <div className="text-xl font-extrabold font-mono text-[#17211F]">
                    {compareData.platform_comparison.average_score} ball
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1] text-xs text-[#64716D]">
            Reyting hisoblash qoidasi: 1) Yuqori ball → 2) Kamroq sarflangan vaqt → 3) Yuqori
            aniqlik → 4) Topshiriqni oldinroq yakunlagan vaqt.
          </div>
        </div>
      </div>

      {/* Detailed Per-Game Statistics Table */}
      <div className="bg-white rounded-3xl border border-[#D6E5E1] shadow-subtle overflow-hidden">
        <div className="px-6 py-5 border-b border-[#D6E5E1]">
          <h3 className="text-base font-extrabold text-[#17211F]">
            Har bir o‘yin bo‘yicha shaxsiy statistika
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7FBFA] border-b border-[#D6E5E1] text-xs font-bold text-[#64716D] uppercase">
                <th className="py-3.5 px-6">Game</th>
                <th className="py-3.5 px-6">Ball</th>
                <th className="py-3.5 px-6">Vaqt</th>
                <th className="py-3.5 px-6">To‘g‘ri javob</th>
                <th className="py-3.5 px-6">Noto‘g‘ri javob</th>
                <th className="py-3.5 px-6">Aniqlik</th>
                <th className="py-3.5 px-6 text-right">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6E5E1]/70 text-sm">
              {games_breakdown.map((g: any) => (
                <tr key={g.game_order} className="hover:bg-[#F7FBFA]">
                  <td className="py-3.5 px-6 font-bold text-[#17211F]">
                    <div className="flex items-center gap-2.5">
                      <GameIcon name={g.icon_name} className="w-4 h-4 text-[#007A63]" />
                      <span>
                        #{g.game_order} {g.game_title}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6 font-mono font-extrabold text-[#007A63]">
                    {g.score} / {g.max_score}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-[#17211F]">
                    {formatSecondsMMSS(g.time_spent)}
                  </td>
                  <td className="py-3.5 px-6 font-mono font-bold text-emerald-700">
                    {g.correct_answers}
                  </td>
                  <td className="py-3.5 px-6 font-mono font-bold text-red-600">
                    {g.wrong_answers}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-[#17211F]">{g.accuracy}%</td>
                  <td className="py-3.5 px-6 text-right">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClasses(
                        g.status
                      )}`}
                    >
                      {getStatusLabel(g.status, t)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
