import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  Gamepad2,
  AlertTriangle,
  Trophy,
  CheckCircle,
  Loader2,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n/translations';

export const RulesPage: React.FC = () => {
  const { user, acceptRules } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [agreed, setAgreed] = useState<boolean>(Boolean(user?.profile?.rules_accepted));
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!agreed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await acceptRules();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Qoidalarni tasdiqlashda xatolik yuz berdi.');
    } finally {
      setSubmitting(false);
    }
  };

  const rulesList = [
    {
      number: '1',
      title: 'Vaqt budjeti',
      icon: Clock,
      badge: '50:00 daqiqa',
      badgeColor: 'bg-emerald-50 text-[#007A63] border-emerald-200',
      points: [
        'Umumiy 8 ta o‘yin uchun jami 50 daqiqa vaqt budjeti beriladi.',
        'Umumiy timer faqatgina birinchi o‘yin boshlangan lahzada ishga tushadi.',
        'Qoidalarni o‘qib chiqish va tanishish vaqti umumiy vaqt budjetidan hisoblanmaydi.',
      ],
    },
    {
      number: '2',
      title: 'Har bir o‘yin 1 marta',
      icon: Gamepad2,
      badge: '1 urinish',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      points: [
        'Platformadagi 8 ta interaktiv o‘yinning har birini faqat 1 marta bajarish mumkin.',
        'Har bir o‘yin uchun alohida vaqt chegarasi va maksimal ball belgilangan.',
        'O‘yin yakunlangandan yoki vaqti tugagandan keyin uni qayta boshlash mumkin emas.',
      ],
    },
    {
      number: '3',
      title: 'Qoidabuzarlik nazorati (Anti-Cheat)',
      icon: AlertTriangle,
      badge: '1 marta = 0 ball',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
      points: [
        'O‘yin davomida boshqa brauzer tab/sahifaga o‘tish, oynani minimize qilish yoki brauzerni almashtirish avtomatik aniqlanadi.',
        '1 marta qoida buzilsa ham o‘sha topshiriq darhol “Qoidabuzildi” holatida tugatiladi.',
        'Qoidabuzarlik qayd etilgan topshiriq uchun ball berilmaydi (0 ball) va qayta urinib bo‘lmaydi.',
      ],
    },
    {
      number: '4',
      title: 'Reyting va natijalar',
      icon: Trophy,
      badge: 'Maks. 867 ball',
      badgeColor: 'bg-emerald-50 text-[#007A63] border-emerald-200',
      points: [
        'Barcha 8 ta o‘yindan to‘plangan ballar yakuniy reyting jadvaliga qo‘shiladi (jami maksimal 867 ball).',
        'Yakuniy reytingda: Ism, Familiya, Guruh, Umumiy ball, Bajarilgan o‘yinlar, Sarflangan vaqt, O‘rtacha vaqt va Reyting o‘rni aks etadi.',
        'Ballar teng bo‘lgan taqdirda kamroq vaqt sarflagan va yuqori aniqlik ko‘rsatgan talaba yuqori o‘rinni egallaydi.',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7FBFA] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-3xl border border-[#D6E5E1] shadow-elevated overflow-hidden"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#007A63] to-[#005F4F] px-6 sm:px-10 py-8 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold mb-3">
              <ShieldAlert className="w-4 h-4" />
              <span>Majburiy tanishuv sahifasi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('rulesTitle')}
            </h1>
            <p className="text-emerald-50/90 text-sm sm:text-base mt-1.5">
              {t('rulesSubtitle')}
            </p>
          </div>

          {/* 4 Rule Cards */}
          <div className="p-6 sm:p-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {rulesList.map((rule) => {
                const Icon = rule.icon;
                return (
                  <div
                    key={rule.number}
                    className="rounded-2xl border border-[#D6E5E1] bg-[#F7FBFA]/60 p-5 flex flex-col justify-between hover:border-[#007A63]/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#E6F4F1] text-[#007A63] flex items-center justify-center font-bold">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#007A63] uppercase tracking-wider">
                              Qoida #{rule.number}
                            </span>
                            <h2 className="text-base font-bold text-[#17211F]">{rule.title}</h2>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${rule.badgeColor}`}
                        >
                          {rule.badge}
                        </span>
                      </div>

                      <ul className="space-y-2 text-xs sm:text-sm text-[#64716D]">
                        {rule.points.map((pt, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-[#007A63] shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Confirmation Checkbox & CTA */}
            <div className="pt-4 border-t border-[#D6E5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-5 h-5 rounded-md border-[#D6E5E1] text-[#007A63] focus:ring-[#007A63] cursor-pointer"
                />
                <span className="text-sm sm:text-base font-semibold text-[#17211F] group-hover:text-[#007A63] transition-colors">
                  {t('rulesCheckbox')}
                </span>
              </label>

              <button
                type="button"
                disabled={!agreed || submitting}
                onClick={handleConfirm}
                className="px-7 py-3.5 rounded-xl bg-[#007A63] hover:bg-[#005F4F] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-sm sm:text-base shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 shrink-0"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('loadingText')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('rulesConfirmBtn')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
