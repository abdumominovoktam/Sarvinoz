import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Search,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Award,
  Clock,
  Target,
  SlidersHorizontal,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { GroupRankingItem, LeaderboardEntry } from '../types';
import { formatSecondsMMSS } from '../utils/formatters';
import { useI18n } from '../i18n/translations';

export const LeaderboardPage: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'students' | 'groups' | 'compare'>('students');

  // Student Leaderboard State
  const [podium, setPodium] = useState<LeaderboardEntry[]>([]);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Pagination
  const [search, setSearch] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [minScore, setMinScore] = useState<string>('');
  const [completedGamesFilter, setCompletedGamesFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('rank');
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 15,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });

  // Group Leaderboard & Comparison State
  const [groupRankings, setGroupRankings] = useState<GroupRankingItem[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);

  const fetchStudentLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (selectedGroup !== 'all') params.set('group', selectedGroup);
      if (minScore.trim()) params.set('min_score', minScore.trim());
      if (completedGamesFilter) params.set('completed_games', completedGamesFilter);
      params.set('sort_by', sortBy);
      params.set('page', String(page));
      params.set('page_size', '15');

      const res = await apiRequest<any>(`/leaderboard/?${params.toString()}`);
      setPodium(res.podium || []);
      setEntries(res.results || []);
      setMyEntry(res.my_entry || null);
      if (res.groups) setGroups(res.groups);
      if (res.pagination) setPagination(res.pagination);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, selectedGroup, minScore, completedGamesFilter, sortBy, page]);

  useEffect(() => {
    fetchStudentLeaderboard();
  }, [fetchStudentLeaderboard]);

  useEffect(() => {
    if (activeTab === 'groups' && groupRankings.length === 0) {
      apiRequest<{ groups: GroupRankingItem[] }>('/leaderboard/groups/')
        .then((res) => setGroupRankings(res.groups || []))
        .catch(() => {});
    }
    if (activeTab === 'compare' && !comparisonData) {
      apiRequest('/results/comparison/')
        .then((res) => setComparisonData(res))
        .catch(() => {});
    }
  }, [activeTab, groupRankings.length, comparisonData]);

  const getMedalBadge = (rankNum: number) => {
    if (rankNum === 1) return '🥇 1';
    if (rankNum === 2) return '🥈 2';
    if (rankNum === 3) return '🥉 3';
    return `#${rankNum}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & View Mode Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#007A63]">
            Jonli Akademik Reyting
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17211F] mt-1">
            Talabalar va Guruhlar Reytingi
          </h1>
        </div>

        <div className="inline-flex p-1 rounded-2xl bg-white border border-[#D6E5E1] shadow-subtle">
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'students'
                ? 'bg-[#007A63] text-white shadow-xs'
                : 'text-[#64716D] hover:text-[#17211F]'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Talabalar reytingi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'groups'
                ? 'bg-[#007A63] text-white shadow-xs'
                : 'text-[#64716D] hover:text-[#17211F]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Guruhlar reytingi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compare')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'compare'
                ? 'bg-[#007A63] text-white shadow-xs'
                : 'text-[#64716D] hover:text-[#17211F]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Natijamni taqqoslash</span>
          </button>
        </div>
      </div>

      {/* TAB 1: STUDENTS LEADERBOARD */}
      {activeTab === 'students' && (
        <div className="space-y-8">
          {/* TOP 3 PODIUM CARDS */}
          {podium.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {podium.map((item, idx) => {
                const medalEmoji = idx === 0 ? '🥇 1-o‘rin' : idx === 1 ? '🥈 2-o‘rin' : '🥉 3-o‘rin';
                const cardRing =
                  idx === 0
                    ? 'border-[#007A63] ring-2 ring-[#007A63]/20 bg-gradient-to-b from-[#E6F4F1]/60 to-white'
                    : 'border-[#D6E5E1] bg-white';

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className={`rounded-3xl border p-6 shadow-subtle flex flex-col justify-between ${cardRing}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-full bg-[#E6F4F1] text-[#005F4F] text-xs font-extrabold">
                        {medalEmoji}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#F7FBFA] border border-[#D6E5E1] text-xs font-mono font-bold text-[#64716D]">
                        Guruh: {item.group_name}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-[#17211F]">
                        {item.first_name} {item.last_name}
                      </h3>
                      <div className="text-3xl font-extrabold font-mono text-[#007A63] mt-2">
                        {item.total_score}{' '}
                        <span className="text-xs font-normal text-[#64716D]">/ 867 ball</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-[#D6E5E1]/70 text-xs">
                      <div>
                        <span className="text-[#64716D] block">O‘yinlar</span>
                        <span className="font-bold font-mono text-[#17211F]">
                          {item.completed_games}/8
                        </span>
                      </div>
                      <div>
                        <span className="text-[#64716D] block">Vaqt</span>
                        <span className="font-bold font-mono text-[#17211F]">
                          {formatSecondsMMSS(item.total_time_spent)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#64716D] block">Aniqlik</span>
                        <span className="font-bold font-mono text-[#007A63]">
                          {item.accuracy}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Highlighted Current User Banner */}
          {myEntry && (
            <div className="bg-gradient-to-r from-[#007A63] to-[#005F4F] rounded-2xl p-4 sm:p-5 text-white flex flex-wrap items-center justify-between gap-4 shadow-subtle">
              <div className="flex items-center gap-3.5">
                <div className="px-3.5 py-2 rounded-xl bg-white/15 font-mono font-extrabold text-lg">
                  #{myEntry.rank}
                </div>
                <div>
                  <div className="text-xs text-emerald-100 font-semibold uppercase">
                    Sizning joriy o‘rningiz
                  </div>
                  <div className="text-base font-extrabold">
                    {myEntry.full_name} ({myEntry.group_name})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs sm:text-sm font-mono">
                <div>
                  <span className="text-emerald-100 block text-[11px]">Ball</span>
                  <span className="font-extrabold text-base">{myEntry.total_score}</span>
                </div>
                <div>
                  <span className="text-emerald-100 block text-[11px]">O‘yinlar</span>
                  <span className="font-extrabold text-base">{myEntry.completed_games}/8</span>
                </div>
                <div>
                  <span className="text-emerald-100 block text-[11px]">Vaqt</span>
                  <span className="font-extrabold text-base">
                    {formatSecondsMMSS(myEntry.total_time_spent)}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-100 block text-[11px]">Aniqlik</span>
                  <span className="font-extrabold text-base">{myEntry.accuracy}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Search, Filter & Sort Controls */}
          <div className="bg-white rounded-2xl border border-[#D6E5E1] p-4 sm:p-5 shadow-subtle space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#64716D]">
              <SlidersHorizontal className="w-4 h-4 text-[#007A63]" />
              <span>Qidiruv, Filtr va Saralash</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-[#64716D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Talabani qidirish..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#D6E5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#007A63]"
                />
              </div>

              {/* Group Filter */}
              <select
                value={selectedGroup}
                onChange={(e) => {
                  setSelectedGroup(e.target.value);
                  setPage(1);
                }}
                aria-label="Guruh bo‘yicha filtr"
                className="px-3.5 py-2.5 rounded-xl border border-[#D6E5E1] text-sm bg-white text-[#17211F] focus:outline-none focus:ring-2 focus:ring-[#007A63]"
              >
                <option value="all">Barcha guruhlar</option>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    Guruh: {g}
                  </option>
                ))}
              </select>

              {/* Completed Games Filter */}
              <select
                value={completedGamesFilter}
                onChange={(e) => {
                  setCompletedGamesFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Tugallangan o‘yinlar bo‘yicha filtr"
                className="px-3.5 py-2.5 rounded-xl border border-[#D6E5E1] text-sm bg-white text-[#17211F] focus:outline-none focus:ring-2 focus:ring-[#007A63]"
              >
                <option value="">Barcha o‘yinlar holati</option>
                <option value="8">8/8 tugatganlar</option>
                <option value="5">Kamida 5 ta o‘yin</option>
                <option value="1">Kamida 1 ta o‘yin</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                aria-label="Saralash turi"
                className="px-3.5 py-2.5 rounded-xl border border-[#D6E5E1] text-sm bg-white text-[#17211F] focus:outline-none focus:ring-2 focus:ring-[#007A63]"
              >
                <option value="rank">Reyting bo‘yicha</option>
                <option value="score_desc">Ball bo‘yicha (Yuqoridan)</option>
                <option value="time_asc">Vaqt bo‘yicha (Eng tez)</option>
                <option value="accuracy_desc">Aniqlik bo‘yicha</option>
              </select>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white rounded-3xl border border-[#D6E5E1] shadow-subtle overflow-hidden">
            {loading ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="p-12 text-center text-[#64716D] font-medium">
                {t('emptyLeaderboard')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7FBFA] border-b border-[#D6E5E1] text-xs font-bold text-[#64716D] uppercase tracking-wider">
                      <th className="py-3.5 px-5">№ / O‘rin</th>
                      <th className="py-3.5 px-5">Talaba</th>
                      <th className="py-3.5 px-5">Guruh</th>
                      <th className="py-3.5 px-5">Ball</th>
                      <th className="py-3.5 px-5">8 o‘yin</th>
                      <th className="py-3.5 px-5">Vaqt</th>
                      <th className="py-3.5 px-5">O‘rtacha vaqt</th>
                      <th className="py-3.5 px-5 text-right">Aniqlik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6E5E1]/70 text-sm">
                    {entries.map((row) => (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          row.is_current_user
                            ? 'bg-[#E6F4F1] font-semibold'
                            : 'hover:bg-[#F7FBFA]'
                        }`}
                      >
                        <td className="py-3.5 px-5 font-mono font-extrabold text-[#17211F]">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs ${
                              row.rank === 1
                                ? 'bg-amber-100 text-amber-900'
                                : row.rank === 2
                                ? 'bg-slate-200 text-slate-800'
                                : row.rank === 3
                                ? 'bg-orange-100 text-orange-900'
                                : 'bg-[#F7FBFA] text-[#64716D]'
                            }`}
                          >
                            {getMedalBadge(row.rank)}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-[#17211F] flex items-center gap-2">
                            <span>
                              {row.last_name} {row.first_name}
                            </span>
                            {row.is_current_user && (
                              <span className="px-2 py-0.5 rounded-md bg-[#007A63] text-white text-[10px] font-bold">
                                Siz
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-5 font-mono text-xs text-[#64716D]">
                          {row.group_name}
                        </td>
                        <td className="py-3.5 px-5 font-mono font-extrabold text-[#007A63]">
                          {row.total_score}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-xs">
                          {row.completed_games}/8
                        </td>
                        <td className="py-3.5 px-5 font-mono text-xs text-[#17211F]">
                          {formatSecondsMMSS(row.total_time_spent)}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-xs text-[#64716D]">
                          {formatSecondsMMSS(Math.round(row.average_time))}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-[#17211F]">
                          {row.accuracy}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {pagination.total_pages > 1 && (
              <div className="px-6 py-4 border-t border-[#D6E5E1] flex items-center justify-between text-xs text-[#64716D]">
                <span>
                  Jami {pagination.total_count} ta talaba • Sahifa {pagination.page} /{' '}
                  {pagination.total_pages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!pagination.has_prev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-xl border border-[#D6E5E1] disabled:opacity-40 hover:bg-[#F7FBFA]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={!pagination.has_next}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-2 rounded-xl border border-[#D6E5E1] disabled:opacity-40 hover:bg-[#F7FBFA]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GROUP LEADERBOARD (Section 15) */}
      {activeTab === 'groups' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {groupRankings.map((grp) => (
              <div
                key={grp.group_id}
                className={`bg-white rounded-3xl border p-6 shadow-subtle space-y-4 ${
                  grp.is_my_group
                    ? 'border-[#007A63] ring-2 ring-[#007A63]/15'
                    : 'border-[#D6E5E1]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-[#E6F4F1] text-[#007A63] font-mono font-extrabold flex items-center justify-center">
                      #{grp.rank}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-extrabold text-[#17211F]">
                          {grp.group_name}
                        </h3>
                        {grp.is_my_group && (
                          <span className="px-2 py-0.5 rounded-md bg-[#007A63] text-white text-[11px] font-bold">
                            Sizning guruhingiz
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64716D]">{grp.faculty}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold font-mono text-[#007A63]">
                      {grp.performance_percentage}%
                    </div>
                    <div className="text-[11px] text-[#64716D]">O‘zlashtirish ko‘rsatkichi</div>
                  </div>
                </div>

                <div className="w-full h-2.5 bg-[#F0F6F4] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#007A63] rounded-full"
                    style={{ width: `${grp.performance_percentage}%` }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F7FBFA] border border-[#D6E5E1]/60">
                    <span className="text-[#64716D] block">Talabalar</span>
                    <span className="font-bold text-[#17211F] font-mono">{grp.student_count}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F7FBFA] border border-[#D6E5E1]/60">
                    <span className="text-[#64716D] block">O‘rtacha ball</span>
                    <span className="font-bold text-[#007A63] font-mono">{grp.average_score}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F7FBFA] border border-[#D6E5E1]/60">
                    <span className="text-[#64716D] block">O‘rtacha aniqlik</span>
                    <span className="font-bold text-[#17211F] font-mono">
                      {grp.average_accuracy}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F7FBFA] border border-[#D6E5E1]/60">
                    <span className="text-[#64716D] block">Yetakchi</span>
                    <span className="font-bold text-[#17211F] truncate block">
                      {grp.top_student_name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: COMPARE MY RESULT WITH OTHERS (Section 14) */}
      {activeTab === 'compare' && comparisonData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#D6E5E1] p-5 shadow-subtle">
              <div className="text-xs font-bold text-[#64716D] uppercase">Sizning ballingiz</div>
              <div className="text-3xl font-extrabold font-mono text-[#007A63] mt-1">
                {comparisonData.my_stats.total_score} ball
              </div>
              <div className="text-xs text-[#64716D] mt-1">
                Guruh o‘rtachasi:{' '}
                <strong className="text-[#17211F]">
                  {comparisonData.group_comparison.average_score} ball
                </strong>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#D6E5E1] p-5 shadow-subtle">
              <div className="text-xs font-bold text-[#64716D] uppercase">Umumiy Reytingda</div>
              <div className="text-3xl font-extrabold font-mono text-[#17211F] mt-1">
                #{comparisonData.my_stats.rank}
              </div>
              <div className="text-xs text-[#64716D] mt-1">
                Jami {comparisonData.platform_comparison.student_count} talaba ichida
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#D6E5E1] p-5 shadow-subtle">
              <div className="text-xs font-bold text-[#64716D] uppercase">
                Guruhda ({comparisonData.my_stats.group_name})
              </div>
              <div className="text-3xl font-extrabold font-mono text-[#007A63] mt-1">
                #{comparisonData.my_stats.group_rank}
              </div>
              <div className="text-xs text-[#64716D] mt-1">
                Guruhdagi {comparisonData.group_comparison.student_count} talaba ichida
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#D6E5E1] p-5 shadow-subtle">
              <div className="text-xs font-bold text-[#64716D] uppercase">Sarflangan Vaqt</div>
              <div className="text-3xl font-extrabold font-mono text-[#17211F] mt-1">
                {formatSecondsMMSS(comparisonData.my_stats.total_time_spent)}
              </div>
              <div className="text-xs text-[#64716D] mt-1">
                Guruh o‘rtachasi:{' '}
                <strong className="text-[#17211F]">
                  {formatSecondsMMSS(Math.round(comparisonData.group_comparison.average_time_spent))}
                </strong>
              </div>
            </div>
          </div>

          {/* Per-Game Visual Comparison Bars */}
          <div className="bg-white rounded-3xl border border-[#D6E5E1] p-6 sm:p-8 shadow-subtle space-y-5">
            <div>
              <h3 className="text-lg font-extrabold text-[#17211F]">
                8 ta o‘yin kesimida natijalarni taqqoslash
              </h3>
              <p className="text-xs text-[#64716D]">
                Sizning ballingiz (Yashil) vs Guruh o‘rtachasi (Ko‘k) vs Platforma o‘rtachasi (Kulrang)
              </p>
            </div>

            <div className="space-y-4">
              {comparisonData.per_game_comparison.map((item: any) => {
                const maxS = item.max_score || 100;
                const myPct = Math.min(100, Math.round((item.my_score / maxS) * 100));
                const grpPct = Math.min(100, Math.round((item.group_avg_score / maxS) * 100));
                return (
                  <div
                    key={item.game_order}
                    className="p-4 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1] space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                      <span className="font-bold text-[#17211F]">
                        #{item.game_order} {item.game_title} (Max: {maxS})
                      </span>
                      <div className="flex items-center gap-4 font-mono text-xs">
                        <span className="text-[#007A63] font-bold">Siz: {item.my_score}</span>
                        <span className="text-blue-700 font-semibold">
                          Guruh o‘rtachasi: {item.group_avg_score}
                        </span>
                        <span className="text-[#64716D]">
                          Platforma: {item.platform_avg_score}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-[#D6E5E1]/60">
                        <div
                          className="h-full bg-[#007A63] rounded-full"
                          style={{ width: `${myPct}%` }}
                        />
                      </div>
                      <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#D6E5E1]/60">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${grpPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
