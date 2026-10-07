import { GameStatus } from '../types';

export function formatSecondsMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function getStatusLabel(status: GameStatus, t?: (k: string) => string): string {
  switch (status) {
    case 'not_started':
      return t ? t('statusNotStarted') : 'Boshlanmagan';
    case 'in_progress':
      return t ? t('statusInProgress') : 'Jarayonda';
    case 'completed':
      return t ? t('statusCompleted') : 'Tugallangan';
    case 'time_expired':
      return t ? t('statusTimeExpired') : 'Vaqt tugagan';
    case 'violation':
      return t ? t('statusViolation') : 'Qoidabuzildi';
    default:
      return 'Boshlanmagan';
  }
}

export function getStatusBadgeClasses(status: GameStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'in_progress':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'time_expired':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'violation':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'not_started':
    default:
      return 'bg-slate-100 text-[#64716D] border-[#D6E5E1]';
  }
}
