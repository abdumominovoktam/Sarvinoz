import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Clock,
  Trophy,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  Gamepad2,
  BarChart3,
  WifiOff,
  Menu,
  X,
  Binary,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useI18n, Locale } from '../i18n/translations';
import { formatSecondsMMSS } from '../utils/formatters';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [globalRemaining, setGlobalRemaining] = useState<number>(
    user?.profile?.remaining_global_seconds ?? 3000
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!user?.profile) return;
    setGlobalRemaining(user.profile.remaining_global_seconds);

    if (!user.profile.global_timer_started_at || user.profile.is_completed) {
      return;
    }

    const startMs = new Date(user.profile.global_timer_started_at).getTime();
    const budget = user.profile.global_time_budget_seconds || 3000;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      const rem = Math.max(0, budget - elapsed);
      setGlobalRemaining(rem);
    }, 1000);

    return () => clearInterval(timer);
  }, [user]);

  if (!user) return null;

  const isGameActiveRoute = location.pathname.startsWith('/play/');

  const navItems = [
    { path: '/dashboard', label: t('navDashboard'), icon: LayoutDashboard },
    { path: '/dashboard#games', label: t('navGames'), icon: Gamepad2 },
    { path: '/leaderboard', label: t('navLeaderboard'), icon: Trophy },
    { path: '/final-result', label: t('navMyResult'), icon: BarChart3 },
    { path: '/profile', label: t('navProfile'), icon: UserIcon },
  ];

  if (user.role === 'admin') {
    navItems.push({ path: '/admin-panel', label: t('navAdmin'), icon: ShieldCheck });
  }

  const handleNavClick = (e: React.MouseEvent, targetPath: string) => {
    setMobileMenuOpen(false);
    if (isGameActiveRoute) {
      e.preventDefault();
      window.dispatchEvent(
        new CustomEvent('sarvinoz:request-exit-game', { detail: { targetPath } })
      );
      return;
    }
    if (targetPath === '/dashboard#games') {
      e.preventDefault();
      navigate('/dashboard');
      setTimeout(() => {
        document.getElementById('games-grid-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <>
      {!isOnline && (
        <div
          role="alert"
          className="bg-red-600 text-white px-4 py-2.5 text-center text-sm font-medium flex items-center justify-center gap-2 shadow-sm z-50"
        >
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>{t('networkOffline')}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#D6E5E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <Link
            to="/dashboard"
            onClick={(e) => handleNavClick(e, '/dashboard')}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-[#007A63] text-white flex items-center justify-center shadow-sm group-hover:bg-[#005F4F] transition-colors">
              <Binary className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-[#17211F] text-base leading-tight tracking-tight">
                {t('brandTitle')}
              </div>
              <div className="text-[11px] text-[#64716D] hidden sm:block">
                {t('brandSubtitle')}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Asosiy navigatsiya">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/dashboard#games'
                  ? false
                  : location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => handleNavClick(e, item.path)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-[#E6F4F1] text-[#007A63] font-semibold'
                      : 'text-[#64716D] hover:text-[#17211F] hover:bg-[#F7FBFA]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Global Timer + Language + User */}
          <div className="flex items-center gap-2.5">
            {/* Persistent Global Timer Pill */}
            <div
              title="Umumiy 50 daqiqalik vaqt budjeti"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-mono font-semibold transition-colors ${
                globalRemaining <= 300
                  ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                  : user.profile?.global_timer_started_at
                  ? 'bg-[#E6F4F1] text-[#005F4F] border-[#007A63]/30'
                  : 'bg-[#F7FBFA] text-[#64716D] border-[#D6E5E1]'
              }`}
            >
              <Clock className="w-4 h-4 text-[#007A63]" />
              <span>{formatSecondsMMSS(globalRemaining)}</span>
            </div>

            {/* Language Switcher */}
            <div className="hidden sm:flex items-center bg-[#F7FBFA] border border-[#D6E5E1] rounded-xl p-0.5">
              {(['uz', 'ru', 'en'] as Locale[]).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocale(loc)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                    locale === loc
                      ? 'bg-[#007A63] text-white shadow-sm'
                      : 'text-[#64716D] hover:text-[#17211F]'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>

            {/* User Badge & Logout */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[#D6E5E1]">
              <div className="text-right">
                <div className="text-xs font-semibold text-[#17211F] leading-tight">
                  {user.first_name} {user.last_name}
                </div>
                <div className="text-[11px] text-[#007A63] font-medium">
                  {user.role === 'admin' ? 'Administrator' : `Guruh: ${user.group_name}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/auth');
                }}
                title="Tizimdan chiqish"
                className="p-2 rounded-xl text-[#64716D] hover:text-red-600 hover:bg-red-50 transition-colors"
                aria-label="Chiqish"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-[#D6E5E1] text-[#17211F] hover:bg-[#F7FBFA]"
              aria-label="Menyuni ochish"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-[#D6E5E1] px-4 pt-2 pb-4 space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-[#D6E5E1]/60">
              <div>
                <div className="text-sm font-bold text-[#17211F]">{user.full_name}</div>
                <div className="text-xs text-[#64716D]">Guruh: {user.group_name}</div>
              </div>
              <div className="flex items-center gap-1">
                {(['uz', 'ru', 'en'] as Locale[]).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocale(loc)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                      locale === loc ? 'bg-[#007A63] text-white' : 'bg-[#F7FBFA] text-[#64716D]'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={(e) => handleNavClick(e, item.path)}
                    className={`px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 ${
                      isActive
                        ? 'bg-[#E6F4F1] text-[#007A63] font-semibold'
                        : 'text-[#17211F] hover:bg-[#F7FBFA]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
                navigate('/auth');
              }}
              className="w-full mt-2 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Tizimdan chiqish</span>
            </button>
          </div>
        )}
      </header>
    </>
  );
};
