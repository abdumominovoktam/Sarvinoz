import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Binary,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Loader2,
  BookOpen,
  ShieldCheck,
  Award,
  Clock,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n/translations';

export const AuthPage: React.FC = () => {
  const { register, login, user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [group, setGroup] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      if (!user.profile?.rules_accepted) {
        navigate('/rules', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const validateRegisterForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) {
      errs.first_name = 'Ism bo‘sh bo‘lishi mumkin emas.';
    }
    if (!lastName.trim()) {
      errs.last_name = 'Familiya bo‘sh bo‘lishi mumkin emas.';
    }
    if (!group.trim()) {
      errs.group = 'Guruh bo‘sh bo‘lishi mumkin emas.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errs.email = 'To‘g‘ri email manzilini kiriting.';
    }
    if (!password || password.length < 6) {
      errs.password = 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setFieldErrors({});

    if (mode === 'register') {
      if (!validateRegisterForm()) return;
      setSubmitting(true);
      try {
        await register({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          group: group.trim(),
          email: email.trim().toLowerCase(),
          password,
        });
        navigate('/rules', { replace: true });
      } catch (err: any) {
        if (err?.data && typeof err.data === 'object') {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(err.data)) {
            mapped[k] = Array.isArray(v) ? String(v[0]) : String(v);
          }
          setFieldErrors(mapped);
        }
        setError(err?.message || 'Ro‘yxatdan o‘tishda xatolik yuz berdi.');
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!email.trim() || !password) {
        setError('Email va parolni kiriting.');
        return;
      }
      setSubmitting(true);
      try {
        const loggedUser = await login(email.trim().toLowerCase(), password);
        if (!loggedUser.profile?.rules_accepted) {
          navigate('/rules', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch (err: any) {
        setError(err?.message || 'Email yoki parol noto‘g‘ri.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FBFA] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Academic Context Column */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-6 space-y-6"
        >
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#E6F4F1] border border-[#007A63]/20 text-[#005F4F] text-xs font-semibold">
            <Binary className="w-4 h-4 text-[#007A63]" />
            <span>Interaktiv Akademik Baholash Platformasi</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17211F] tracking-tight leading-tight">
            Kompyuterda sonlarni tasvirlash va qayta ishlash.{' '}
            <span className="text-[#007A63]">Sanoq sistemalari.</span>
          </h1>

          <p className="text-[#64716D] text-base leading-relaxed">
            Talabalarning ikkilik (Binary), sakkizlik (Octal), o‘nlik (Decimal) va o‘n oltilik
            (Hexadecimal) sanoq sistemalari, pozitsion razryadlar hamda ikkilik arifmetika bo‘yicha
            amaliy va algoritmik bilimlarini 8 ta interaktiv o‘yin orqali tekshirish tizimi.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-white p-4 rounded-2xl border border-[#D6E5E1] shadow-subtle flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#E6F4F1] text-[#007A63]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-[#17211F] text-sm">8 ta Interaktiv O‘yin</div>
                <div className="text-xs text-[#64716D] mt-0.5">
                  Viktorina, Krossvord, Bingo, Sxema va algoritmlar
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#D6E5E1] shadow-subtle flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#E6F4F1] text-[#007A63]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-[#17211F] text-sm">50 Daqiqa Budjet</div>
                <div className="text-xs text-[#64716D] mt-0.5">
                  Server tomonidan himoyalangan aniq vaqt nazorati
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#D6E5E1] shadow-subtle flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#E6F4F1] text-[#007A63]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-[#17211F] text-sm">867 Maksimal Ball</div>
                <div className="text-xs text-[#64716D] mt-0.5">
                  Aniqlik va tezlik asosida adolatli baholash
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#D6E5E1] shadow-subtle flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#E6F4F1] text-[#007A63]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-[#17211F] text-sm">Jonli Reyting</div>
                <div className="text-xs text-[#64716D] mt-0.5">
                  Talabalar va guruhlar kesimida shaffof taqqoslash
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Form Card Column */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="lg:col-span-6"
        >
          <div className="bg-white rounded-3xl border border-[#D6E5E1] shadow-elevated p-6 sm:p-8">
            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 p-1 bg-[#F7FBFA] rounded-2xl border border-[#D6E5E1] mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setFieldErrors({});
                }}
                className={`py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  mode === 'register'
                    ? 'bg-[#007A63] text-white shadow-sm'
                    : 'text-[#64716D] hover:text-[#17211F]'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('registerTitle')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setFieldErrors({});
                }}
                className={`py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  mode === 'login'
                    ? 'bg-[#007A63] text-white shadow-sm'
                    : 'text-[#64716D] hover:text-[#17211F]'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>{t('loginTitle')}</span>
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {mode === 'register' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-xs font-semibold text-[#17211F] uppercase tracking-wider mb-1.5"
                      >
                        Ism *
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="O‘ktam"
                        className={`w-full px-4 py-2.5 rounded-xl border ${
                          fieldErrors.first_name ? 'border-red-400 bg-red-50/30' : 'border-[#D6E5E1]'
                        } text-[#17211F] placeholder-[#64716D]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#007A63]`}
                      />
                      {fieldErrors.first_name && (
                        <p className="text-xs text-red-600 mt-1">{fieldErrors.first_name}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-xs font-semibold text-[#17211F] uppercase tracking-wider mb-1.5"
                      >
                        Familiya *
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Abdumo‘minov"
                        className={`w-full px-4 py-2.5 rounded-xl border ${
                          fieldErrors.last_name ? 'border-red-400 bg-red-50/30' : 'border-[#D6E5E1]'
                        } text-[#17211F] placeholder-[#64716D]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#007A63]`}
                      />
                      {fieldErrors.last_name && (
                        <p className="text-xs text-red-600 mt-1">{fieldErrors.last_name}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="group"
                      className="block text-xs font-semibold text-[#17211F] uppercase tracking-wider mb-1.5"
                    >
                      Guruh *
                    </label>
                    <input
                      id="group"
                      type="text"
                      value={group}
                      onChange={(e) => setGroup(e.target.value)}
                      placeholder="162-23"
                      className={`w-full px-4 py-2.5 rounded-xl border ${
                        fieldErrors.group ? 'border-red-400 bg-red-50/30' : 'border-[#D6E5E1]'
                      } text-[#17211F] placeholder-[#64716D]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#007A63]`}
                    />
                    {fieldErrors.group && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.group}</p>
                    )}
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-[#17211F] uppercase tracking-wider mb-1.5"
                >
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    fieldErrors.email ? 'border-red-400 bg-red-50/30' : 'border-[#D6E5E1]'
                  } text-[#17211F] placeholder-[#64716D]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#007A63]`}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[#17211F] uppercase tracking-wider mb-1.5"
                >
                  Parol * <span className="text-[#64716D] font-normal">(kamida 6 ta belgi)</span>
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    fieldErrors.password ? 'border-red-400 bg-red-50/30' : 'border-[#D6E5E1]'
                  } text-[#17211F] placeholder-[#64716D]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#007A63]`}
                />
                {fieldErrors.password && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-xl bg-[#007A63] hover:bg-[#005F4F] disabled:opacity-60 text-white font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('loadingText')}</span>
                  </>
                ) : mode === 'register' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ro‘yxatdan o‘tish va boshlash</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Tizimga kirish</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
