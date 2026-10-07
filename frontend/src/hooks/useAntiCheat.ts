import { useEffect, useRef, useCallback } from 'react';
import { apiRequest } from '../services/api';
import { GameResultSummary } from '../types';

export interface ViolationResponse {
  debounced?: boolean;
  violation_count: number;
  max_violations: number;
  warning_level: number;
  status: string;
  terminated?: boolean;
  score?: number;
  message: string;
  result?: GameResultSummary;
}

interface UseAntiCheatOptions {
  enabled: boolean;
  gameOrder: number;
  onWarning: (info: ViolationResponse) => void;
  onTerminated: (info: ViolationResponse) => void;
}

export function useAntiCheat({
  enabled,
  gameOrder,
  onWarning,
  onTerminated,
}: UseAntiCheatOptions) {
  const lastReportedAtRef = useRef<number>(0);
  const enabledAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (enabled) {
      enabledAtRef.current = Date.now();
    }
  }, [enabled]);

  const reportViolation = useCallback(
    async (violationType: string, description: string) => {
      if (!enabled) return;
      const now = Date.now();
      // Ignore focus jitter during the first 1200ms of game arena mount
      if (now - enabledAtRef.current < 1200) {
        return;
      }
      // Local cooldown so simultaneous blur + visibilitychange don't fire twice
      if (now - lastReportedAtRef.current < 2000) {
        return;
      }
      lastReportedAtRef.current = now;

      try {
        const res = await apiRequest<ViolationResponse>('/games/violation/', {
          method: 'POST',
          body: JSON.stringify({
            game_order: gameOrder,
            violation_type: violationType,
            description,
          }),
        });
        if (res.terminated || res.status === 'violation') {
          onTerminated(res);
        } else if (!res.debounced) {
          onWarning(res);
        }
      } catch {
        // Ignore transient network errors on log
      }
    },
    [enabled, gameOrder, onWarning, onTerminated]
  );

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation(
          'tab_switch',
          'Foydalanuvchi boshqa brauzer tabiga yoki oynasiga o‘tdi.'
        );
      }
    };

    const handleWindowBlur = () => {
      reportViolation(
        'window_blur',
        'Test oynasi fokusni yo‘qotdi (oyna minimize qilindi yoki almashtirildi).'
      );
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        reportViolation(
          'fullscreen_exit',
          'Foydalanuvchi to‘liq ekran (Fullscreen) rejimidan chiqdi.'
        );
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, reportViolation]);
}
