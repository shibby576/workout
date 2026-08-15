// Display formatting for the feedback card. Kept out of structuring so the
// SessionSummary stays pure numbers — the eval harness compares values, not
// strings.

import type { IntentType } from './sessionSummary';

export const INTENT_LABELS: Record<IntentType, string> = {
  recovery: 'Recovery',
  base: 'Base',
  threshold: 'Threshold',
  vo2max: 'VO2 max',
};

export const INTENT_BLURBS: Record<IntentType, string> = {
  recovery: 'Easy shakeout. Staying easy is the point.',
  base: 'Aerobic base — conversational, sustainable.',
  threshold: 'Comfortably hard, right around your one-hour effort.',
  vo2max: 'Hard intervals near max, repeatable across reps.',
};

/** Seconds per mile as m:ss. */
export function pace(secPerMi: number | undefined): string {
  if (!secPerMi || !Number.isFinite(secPerMi) || secPerMi <= 0) return '—';
  const m = Math.floor(secPerMi / 60);
  const s = Math.round(secPerMi % 60);
  return s === 60 ? `${m + 1}:00` : `${m}:${String(s).padStart(2, '0')}`;
}

export function paceRange(fast: number, slow: number): string {
  return `${pace(fast)}–${pace(slow)}/mi`;
}

/** Seconds as h:mm:ss or m:ss. */
export function duration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Compact duration for zone bars — "42m", "1h 05m". */
export function shortDuration(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

export function activityDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function miles(m: number | undefined): string {
  return m === undefined ? '—' : `${m.toFixed(2)} mi`;
}
