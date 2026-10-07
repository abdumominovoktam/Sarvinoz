import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Gamepad2,
  HelpCircle,
  BarChart3,
  ShieldAlert,
  Download,
  Plus,
  Trash2,
  Edit3,
  Ban,
  CheckCircle2,
  Save,
  X,
  FolderKanban,
} from 'lucide-react';
import { apiRequest, downloadExportFile } from '../services/api';
import { formatSecondsMMSS } from '../utils/formatters';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'stats' | 'students' | 'groups' | 'games' | 'questions' | 'violations'
  >('stats');

  const [statsData, setStatsData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [violationsData, setViolationsData] = useState<any>({
    game_results: [],
    violations: [],
  });

  // Filters & Form states
  const [studentSearch, setStudentSearch] = useState('');
  const [questionGameFilter, setQuestionGameFilter] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupFaculty, setNewGroupFaculty] = useState(
    'Axborot texnologiyalari va kompyuter injiniringi'
  );
  const [editingGame, setEditingGame] = useState<any | null>(null);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [qForm, setQForm] = useState({
    game: 1,
    question_text: '',
    question_type: 'multiple_choice',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correct_answer: 'A',
    points: 15,
    difficulty: 'Medium',
    explanation: '',
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadStats = useCallback(async () => {
    const res = await apiRequest('/admin-panel/statistics/');
    setStatsData(res);
  }, []);

  const loadStudents = useCallback(async () => {
    const q = studentSearch.trim() ? `?search=${encodeURIComponent(studentSearch.trim())}` : '';
    const res = await apiRequest<{ students: any[] }>(`/admin-panel/students/${q}`);
    setStudents(res.students || []);
  }, [studentSearch]);

  const loadGroups = useCallback(async () => {
    const res = await apiRequest<any[]>('/admin-panel/groups/');
    setGroups(res || []);
  }, []);

  const loadGames = useCallback(async () => {
    const res = await apiRequest<any[]>('/admin-panel/games/');
    setGames(res || []);
  }, []);

  const loadQuestions = useCallback(async () => {
    const q = questionGameFilter ? `?game=${questionGameFilter}` : '';
    const res = await apiRequest<any[]>(`/admin-panel/questions/${q}`);
    setQuestions(res || []);
  }, [questionGameFilter]);

  const loadViolations = useCallback(async () => {
    const res = await apiRequest('/admin-panel/results/');
    setViolationsData(res);
  }, []);

  useEffect(() => {
    loadStats();
    loadGames();
  }, [loadStats, loadGames]);

  useEffect(() => {
    if (activeTab === 'students') loadStudents();
    if (activeTab === 'groups') loadGroups();
    if (activeTab === 'games') loadGames();
    if (activeTab === 'questions') loadQuestions();
    if (activeTab === 'violations') loadViolations();
  }, [activeTab, loadStudents, loadGroups, loadGames, loadQuestions, loadViolations]);

  const handleToggleBlockStudent = async (userId: number) => {
    const res = await apiRequest<{ message: string }>(`/admin-panel/students/${userId}/toggle-block/`, {
      method: 'POST',
    });
    showToast(res.message);
    loadStudents();
    loadStats();
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await apiRequest('/admin-panel/groups/', {
      method: 'POST',
      body: JSON.stringify({
        name: newGroupName.trim(),
        faculty: newGroupFaculty.trim(),
        course: 2,
      }),
    });
    setNewGroupName('');
    showToast('Yangi guruh muvaffaqiyatli qo‘shildi!');
    loadGroups();
  };

  const handleDeleteGroup = async (groupId: number) => {
    await apiRequest(`/admin-panel/groups/${groupId}/`, { method: 'DELETE' });
    showToast('Guruh o‘chirildi.');
    loadGroups();
  };

  const handleSaveGameConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame) return;
    await apiRequest(`/admin-panel/games/${editingGame.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: editingGame.title,
        description: editingGame.description,
        duration_seconds: Number(editingGame.duration_seconds),
        max_score: Number(editingGame.max_score),
        is_active: Boolean(editingGame.is_active),
      }),
    });
    setEditingGame(null);
    showToast('O‘yin sozlamalari yangilandi!');
    loadGames();
    loadStats();
  };

  const openAddQuestionModal = () => {
    setEditingQuestion(null);
    setQForm({
      game: games[0]?.id || 1,
      question_text: '',
      question_type: 'multiple_choice',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correct_answer: 'A',
      points: 15,
      difficulty: 'Medium',
      explanation: '',
    });
    setQuestionModalOpen(true);
  };

  const openEditQuestionModal = (q: any) => {
    setEditingQuestion(q);
    setQForm({
      game: q.game,
      question_text: q.question_text,
      question_type: q.question_type,
      optionA: q.options?.A || '',
      optionB: q.options?.B || '',
      optionC: q.options?.C || '',
      optionD: q.options?.D || '',
      correct_answer:
        typeof q.correct_answer === 'string'
          ? q.correct_answer
          : JSON.stringify(q.correct_answer),
      points: q.points,
      difficulty: q.difficulty,
      explanation: q.explanation || '',
    });
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const optionsPayload =
      qForm.question_type === 'multiple_choice'
        ? {
            A: qForm.optionA,
            B: qForm.optionB,
            C: qForm.optionC,
            D: qForm.optionD,
          }
        : editingQuestion?.options || {};

    const body = {
      game: Number(qForm.game),
      question_text: qForm.question_text,
      question_type: qForm.question_type,
      options: optionsPayload,
      correct_answer: qForm.correct_answer,
      points: Number(qForm.points),
      difficulty: qForm.difficulty,
      explanation: qForm.explanation,
    };

    if (editingQuestion) {
      await apiRequest(`/admin-panel/questions/${editingQuestion.id}/`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      showToast('Savol tahrirlandi!');
    } else {
      await apiRequest('/admin-panel/questions/', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      showToast('Yangi savol bazaga qo‘shildi!');
    }
    setQuestionModalOpen(false);
    loadQuestions();
  };

  const handleDeleteQuestion = async (qId: number) => {
    await apiRequest(`/admin-panel/questions/${qId}/`, { method: 'DELETE' });
    showToast('Savol o‘chirildi.');
    loadQuestions();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Admin Header + Export Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#007A63]">
            Administrator Boshqaruv Markazi
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17211F] mt-1">
            Platforma Statistikasi va Boshqaruv
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => downloadExportFile('csv')}
            className="px-4 py-2.5 rounded-xl border border-[#D6E5E1] bg-white hover:bg-[#F7FBFA] text-[#17211F] text-xs sm:text-sm font-bold flex items-center gap-2 shadow-subtle"
          >
            <Download className="w-4 h-4 text-[#007A63]" />
            <span>CSV Eksport</span>
          </button>
          <button
            type="button"
            onClick={() => downloadExportFile('excel')}
            className="px-4 py-2.5 rounded-xl bg-[#007A63] hover:bg-[#005F4F] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Excel (.xlsx) Eksport</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-between shadow-md">
          <span>{toastMsg}</span>
          <button type="button" onClick={() => setToastMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl border border-[#D6E5E1] shadow-subtle">
        {[
          { id: 'stats', label: 'Statistika va Grafiklar', icon: BarChart3 },
          { id: 'students', label: 'Talabalar', icon: Users },
          { id: 'groups', label: 'Guruhlar', icon: FolderKanban },
          { id: 'games', label: '8 ta O‘yin Sozlamalari', icon: Gamepad2 },
          { id: 'questions', label: 'Savollar Bazasi', icon: HelpCircle },
          { id: 'violations', label: 'Natijalar va Anti-Cheat', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                active
                  ? 'bg-[#007A63] text-white shadow-xs'
                  : 'text-[#64716D] hover:text-[#17211F] hover:bg-[#F7FBFA]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ADMIN ANALYTICS & CHARTS (Section 31) */}
      {activeTab === 'stats' && statsData && (
        <div className="space-y-8">
          {/* 8 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#D6E5E1] p-5 shadow-subtle">
              <div className="text-xs font-semibold text-[#64716D]">Jami talabalar</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#17211F] mt-1">
                {statsData.kpis.total_students}
              </div>
              <div className="text-[11px] text-[#007A63] mt-1">
                Faol: {statsData.kpis.active_students} ta
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#D6E5E1] p-5 shadow-subtle">
              <div className="text-xs font-semibold text-[#64716D]">Testni to‘liq tugatganlar</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#007A63] mt-1">
                {statsData.kpis.completed_students}
              </div>
              <div className="text-[11px] text-[#64716D] mt-1">8/8 o‘yinni yakunlagan</div>
            </div>

            <div className="bg-white rounded-2xl border border-[#D6E5E1] p-5 shadow-subtle">
              <div className="text-xs font-semibold text-[#64716D]">O‘rtacha ball</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#17211F] mt-1">
                {statsData.kpis.average_score}
              </div>
              <div className="text-[11px] text-[#64716D] mt-1">
                O‘rtacha aniqlik: {statsData.kpis.average_accuracy}%
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#D6E5E1] p-5 shadow-subtle">
              <div className="text-xs font-semibold text-[#64716D]">Eng yuqori ball</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#007A63] mt-1">
                {statsData.kpis.highest_score}
              </div>
              <div className="text-[11px] text-[#17211F] font-medium truncate mt-1">
                {statsData.kpis.top_scorer_name}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#D6E5E1] p-5 shadow-subtle">
              <div className="text-xs font-semibold text-[#64716D]">O‘rtacha sarflangan vaqt</div>
              <div className="text-2xl font-extrabold font-mono text-[#17211F] mt-1">
                {formatSecondsMMSS(Math.round(statsData.kpis.average_time_seconds))}
              </div>
              <div className="text-[11px] text-[#64716D] mt-1">50:00 budjetdan</div>
            </div>

            <div className="bg-white rounded-2xl border border-[#D6E5E1] p-5 shadow-subtle">
              <div className="text-xs font-semibold text-[#64716D]">Eng tez tugatgan</div>
              <div className="text-lg font-extrabold text-[#17211F] truncate mt-1">
                {statsData.kpis.fastest_finisher.name}
              </div>
              <div className="text-xs font-mono text-[#007A63] font-bold mt-0.5">
                {formatSecondsMMSS(statsData.kpis.fastest_finisher.time_spent)} •{' '}
                {statsData.kpis.fastest_finisher.score} ball
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#D6E5E1] p-5 shadow-subtle">
              <div className="text-xs font-semibold text-[#64716D]">Eng ko‘p qoidabuzarlik</div>
              <div className="text-lg font-extrabold text-red-600 truncate mt-1">
                {statsData.kpis.most_violations.name}
              </div>
              <div className="text-xs text-[#64716D] mt-0.5">
                {statsData.kpis.most_violations.count} marta ({statsData.kpis.most_violations.group})
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#D6E5E1] p-5 shadow-subtle">
              <div className="text-xs font-semibold text-[#64716D]">Jami Anti-Cheat loglar</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-600 mt-1">
                {statsData.kpis.total_violations_count}
              </div>
              <div className="text-[11px] text-[#64716D] mt-1">Server jurnalida saqlangan</div>
            </div>
          </div>

          {/* Charts Row: Ball Distribution + Group Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white rounded-3xl border border-[#D6E5E1] p-6 shadow-subtle space-y-4">
              <h3 className="text-base font-extrabold text-[#17211F]">
                Ballar taqsimoti (Score Distribution)
              </h3>
              <div className="space-y-3">
                {statsData.score_distribution.map((b: any) => {
                  const pct = Math.min(
                    100,
                    Math.round((b.count / Math.max(1, statsData.kpis.total_students)) * 100)
                  );
                  return (
                    <div key={b.range} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="font-mono text-[#17211F]">{b.range} ball</span>
                        <span className="text-[#007A63]">
                          {b.count} talaba ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-[#F0F6F4] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#007A63] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-6 bg-white rounded-3xl border border-[#D6E5E1] p-6 shadow-subtle space-y-4">
              <h3 className="text-base font-extrabold text-[#17211F]">
                Guruhlar solishtirmasi (Group Comparison)
              </h3>
              <div className="space-y-3">
                {statsData.group_comparison.map((g: any) => (
                  <div key={g.group_name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#17211F]">
                        Guruh {g.group_name} ({g.student_count} talaba)
                      </span>
                      <span className="font-mono text-[#007A63]">
                        O‘rtacha: {g.average_score} ball ({g.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-[#F0F6F4] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#005F4F] rounded-full"
                        style={{ width: `${g.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 8 Games Completion & Average Score Table */}
          <div className="bg-white rounded-3xl border border-[#D6E5E1] shadow-subtle overflow-hidden">
            <div className="px-6 py-4 border-b border-[#D6E5E1]">
              <h3 className="text-base font-extrabold text-[#17211F]">
                8 ta o‘yin bo‘yicha bajarilish va o‘rtacha ko‘rsatkichlar
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F7FBFA] border-b border-[#D6E5E1] text-xs font-bold text-[#64716D] uppercase">
                    <th className="py-3 px-6">O‘yin</th>
                    <th className="py-3 px-6">Bajarganlar</th>
                    <th className="py-3 px-6">O‘rtacha Ball</th>
                    <th className="py-3 px-6">O‘rtacha Vaqt</th>
                    <th className="py-3 px-6 text-right">O‘rtacha Aniqlik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6E5E1]/70">
                  {statsData.game_analytics.map((ga: any) => (
                    <tr key={ga.id} className="hover:bg-[#F7FBFA]">
                      <td className="py-3.5 px-6 font-bold text-[#17211F]">
                        #{ga.order} {ga.title}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-xs">
                        {ga.completions} ta ({ga.completion_rate}%)
                      </td>
                      <td className="py-3.5 px-6 font-mono font-bold text-[#007A63]">
                        {ga.average_score} / {ga.max_score}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-xs">
                        {formatSecondsMMSS(Math.round(ga.average_time))}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-bold">
                        {ga.average_accuracy}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENTS MANAGEMENT */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl border border-[#D6E5E1] shadow-subtle overflow-hidden">
          <div className="p-5 border-b border-[#D6E5E1] flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-[#17211F]">
              Ro‘yxatdan o‘tgan talabalar ({students.length})
            </h3>
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Ism, familiya yoki email bo‘yicha qidirish..."
              className="px-4 py-2 rounded-xl border border-[#D6E5E1] text-sm w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-[#007A63]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F7FBFA] border-b border-[#D6E5E1] text-xs font-bold text-[#64716D] uppercase">
                  <th className="py-3.5 px-5">Talaba</th>
                  <th className="py-3.5 px-5">Guruh</th>
                  <th className="py-3.5 px-5">Ball / Reyting</th>
                  <th className="py-3.5 px-5">O‘yinlar</th>
                  <th className="py-3.5 px-5">Qoidabuzarlik</th>
                  <th className="py-3.5 px-5">Holat</th>
                  <th className="py-3.5 px-5 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6E5E1]/70">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-[#F7FBFA]">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-[#17211F]">{st.full_name}</div>
                      <div className="text-xs text-[#64716D]">{st.email}</div>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs">{st.group_name}</td>
                    <td className="py-3.5 px-5 font-mono font-bold text-[#007A63]">
                      {st.total_score} ball {st.rank ? `(#${st.rank})` : ''}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs">{st.completed_games}/8</td>
                    <td className="py-3.5 px-5 font-mono text-xs">
                      <span
                        className={
                          st.violations_count > 0
                            ? 'text-red-600 font-bold'
                            : 'text-[#64716D]'
                        }
                      >
                        {st.violations_count} ta
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      {st.is_blocked ? (
                        <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
                          Bloklangan
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                          Faol
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleBlockStudent(st.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 ${
                          st.is_blocked
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        }`}
                      >
                        {st.is_blocked ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Blokdan chiqarish</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5" />
                            <span>Bloklash</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GROUPS MANAGEMENT */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#D6E5E1] p-6 shadow-subtle space-y-4 h-fit">
            <h3 className="text-base font-extrabold text-[#17211F]">Yangi guruh qo‘shish</h3>
            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#64716D] uppercase mb-1">
                  Guruh shifri / nomi
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Masalan: 164-23"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D6E5E1] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#64716D] uppercase mb-1">
                  Fakultet / Yo‘nalish
                </label>
                <input
                  type="text"
                  value={newGroupFaculty}
                  onChange={(e) => setNewGroupFaculty(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D6E5E1] text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#007A63] hover:bg-[#005F4F] text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Guruhni saqlash</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#D6E5E1] p-6 shadow-subtle space-y-3">
            <h3 className="text-base font-extrabold text-[#17211F]">Mavjud guruhlar</h3>
            {groups.map((grp) => (
              <div
                key={grp.id}
                className="p-4 rounded-2xl bg-[#F7FBFA] border border-[#D6E5E1] flex items-center justify-between"
              >
                <div>
                  <div className="font-extrabold text-[#17211F] text-base">{grp.name}</div>
                  <div className="text-xs text-[#64716D]">
                    {grp.faculty} • {grp.student_count || 0} ta talaba
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteGroup(grp.id)}
                  className="p-2 rounded-xl text-red-600 hover:bg-red-50"
                  title="O‘chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: GAMES CONFIGURATION (Edit Time & Max Score) */}
      {activeTab === 'games' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {games.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-3xl border border-[#D6E5E1] p-6 shadow-subtle flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#007A63]">
                      O‘yin #{g.order} ({g.game_type})
                    </span>
                    <span className="text-xs text-[#64716D]">
                      Savollar: {g.questions_count} ta
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#17211F] mt-1">{g.title}</h3>
                  <p className="text-xs text-[#64716D] mt-1">{g.description}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#D6E5E1]">
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span>
                      Vaqt: <strong>{Math.round(g.duration_seconds / 60)} daq ({g.duration_seconds}s)</strong>
                    </span>
                    <span>
                      Max ball: <strong className="text-[#007A63]">{g.max_score}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingGame({ ...g })}
                    className="px-3.5 py-2 rounded-xl bg-[#E6F4F1] hover:bg-[#D1ECE6] text-[#005F4F] text-xs font-bold flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Tahrirlash</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {editingGame && (
            <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
              <form
                onSubmit={handleSaveGameConfig}
                className="bg-white rounded-3xl border border-[#D6E5E1] p-6 sm:p-8 max-w-md w-full space-y-4 shadow-elevated"
              >
                <h3 className="text-lg font-extrabold text-[#17211F]">
                  #{editingGame.order} {editingGame.title} — Sozlamalar
                </h3>
                <div>
                  <label className="block text-xs font-bold text-[#64716D] uppercase mb-1">
                    O‘yin nomi
                  </label>
                  <input
                    type="text"
                    value={editingGame.title}
                    onChange={(e) => setEditingGame({ ...editingGame, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-[#D6E5E1] text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#64716D] uppercase mb-1">
                      Vaqt (soniyalarda)
                    </label>
                    <input
                      type="number"
                      value={editingGame.duration_seconds}
                      onChange={(e) =>
                        setEditingGame({ ...editingGame, duration_seconds: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-[#D6E5E1] text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#64716D] uppercase mb-1">
                      Maksimal Ball
                    </label>
                    <input
                      type="number"
                      value={editingGame.max_score}
                      onChange={(e) =>
                        setEditingGame({ ...editingGame, max_score: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-[#D6E5E1] text-sm font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingGame(null)}
                    className="px-4 py-2 rounded-xl border border-[#D6E5E1] text-xs font-bold"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#007A63] text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Saqlash</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: QUESTIONS DATABASE CRUD */}
      {activeTab === 'questions' && (
        <div className="bg-white rounded-3xl border border-[#D6E5E1] shadow-subtle overflow-hidden">
          <div className="p-5 border-b border-[#D6E5E1] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-extrabold text-[#17211F]">
                Savollar bazasi ({questions.length})
              </h3>
              <select
                value={questionGameFilter}
                onChange={(e) => setQuestionGameFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#D6E5E1] text-xs font-semibold"
              >
                <option value="">Barcha 8 ta o‘yin</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    #{g.order} {g.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={openAddQuestionModal}
              className="px-4 py-2 rounded-xl bg-[#007A63] hover:bg-[#005F4F] text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi savol qo‘shish</span>
            </button>
          </div>

          <div className="divide-y divide-[#D6E5E1]/70">
            {questions.map((q) => (
              <div
                key={q.id}
                className="p-5 hover:bg-[#F7FBFA] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-3xl">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-[#E6F4F1] text-[#007A63] font-bold">
                      #{q.game_order} {q.game_title}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[#64716D] font-mono">
                      {q.difficulty}
                    </span>
                    <span className="text-[#64716D] font-mono">Ball: {q.points}</span>
                  </div>
                  <p className="text-sm font-bold text-[#17211F]">{q.question_text}</p>
                  <div className="text-xs font-mono text-emerald-700">
                    To‘g‘ri javob:{' '}
                    {typeof q.correct_answer === 'string'
                      ? q.correct_answer
                      : JSON.stringify(q.correct_answer)}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditQuestionModal(q)}
                    className="p-2 rounded-xl border border-[#D6E5E1] hover:bg-white text-[#17211F]"
                    title="Tahrirlash"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-600"
                    title="O‘chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {questionModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
              <form
                onSubmit={handleSaveQuestion}
                className="bg-white rounded-3xl border border-[#D6E5E1] p-6 max-w-lg w-full space-y-3 shadow-elevated max-h-[90vh] overflow-y-auto"
              >
                <h3 className="text-lg font-extrabold text-[#17211F]">
                  {editingQuestion ? 'Savolni tahrirlash' : 'Yangi savol qo‘shish'}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#64716D] mb-1">O‘yin</label>
                    <select
                      value={qForm.game}
                      onChange={(e) => setQForm({ ...qForm, game: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-[#D6E5E1] text-xs"
                    >
                      {games.map((g) => (
                        <option key={g.id} value={g.id}>
                          #{g.order} {g.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#64716D] mb-1">
                      Qiyinlik darajasi
                    </label>
                    <select
                      value={qForm.difficulty}
                      onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#D6E5E1] text-xs"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#64716D] mb-1">
                    Savol matni / Topshiriq
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={qForm.question_text}
                    onChange={(e) => setQForm({ ...qForm, question_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D6E5E1] text-xs"
                  />
                </div>

                {qForm.question_type === 'multiple_choice' && (
                  <div className="grid grid-cols-2 gap-2">
                    {(['A', 'B', 'C', 'D'] as const).map((k) => (
                      <div key={k}>
                        <label className="block text-[11px] font-bold text-[#64716D]">
                          Variant {k}
                        </label>
                        <input
                          type="text"
                          value={(qForm as any)[`option${k}`]}
                          onChange={(e) =>
                            setQForm({ ...qForm, [`option${k}`]: e.target.value })
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-[#D6E5E1] text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#64716D] mb-1">
                      To‘g‘ri javob
                    </label>
                    <input
                      type="text"
                      required
                      value={qForm.correct_answer}
                      onChange={(e) => setQForm({ ...qForm, correct_answer: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#D6E5E1] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#64716D] mb-1">Ball</label>
                    <input
                      type="number"
                      value={qForm.points}
                      onChange={(e) => setQForm({ ...qForm, points: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-[#D6E5E1] text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#64716D] mb-1">
                    Izoh (Explanation)
                  </label>
                  <input
                    type="text"
                    value={qForm.explanation}
                    onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D6E5E1] text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setQuestionModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#D6E5E1] text-xs font-bold"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#007A63] text-white text-xs font-bold"
                  >
                    Saqlash
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: RESULTS & ANTI-CHEAT VIOLATION LOGS */}
      {activeTab === 'violations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-3xl border border-[#D6E5E1] shadow-subtle overflow-hidden">
            <div className="px-6 py-4 border-b border-[#D6E5E1]">
              <h3 className="text-base font-extrabold text-[#17211F]">
                Qoidabuzarliklar Jurnali (ViolationLog)
              </h3>
            </div>
            <div className="divide-y divide-[#D6E5E1]/70 max-h-[500px] overflow-y-auto">
              {violationsData.violations.map((v: any) => (
                <div key={v.id} className="p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#17211F]">
                      {v.user_name} ({v.user_group})
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-mono font-bold">
                      {v.violation_type}
                    </span>
                  </div>
                  <p className="text-xs text-[#64716D]">{v.description}</p>
                  <div className="text-[11px] text-[#64716D]">
                    O‘yin: {v.game_title || 'Umumiy'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 bg-white rounded-3xl border border-[#D6E5E1] shadow-subtle overflow-hidden">
            <div className="px-6 py-4 border-b border-[#D6E5E1]">
              <h3 className="text-base font-extrabold text-[#17211F]">
                So‘nggi o‘yin natijalari (GameResult)
              </h3>
            </div>
            <div className="divide-y divide-[#D6E5E1]/70 max-h-[500px] overflow-y-auto">
              {violationsData.game_results.map((gr: any) => (
                <div
                  key={gr.id}
                  className="p-4 flex items-center justify-between text-xs sm:text-sm"
                >
                  <div>
                    <div className="font-bold text-[#17211F]">
                      {gr.user_name} ({gr.user_group})
                    </div>
                    <div className="text-xs text-[#64716D]">
                      #{gr.game_order} {gr.game_title}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-extrabold text-[#007A63]">
                      {gr.score} / {gr.max_score} ball
                    </div>
                    <div className="text-[11px] text-[#64716D]">
                      {formatSecondsMMSS(gr.time_spent)} • {gr.accuracy}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
