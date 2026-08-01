import type { Adherence, Week } from '../types';

export function computeAdherence(week: Week): Adherence {
  const done = week.matches.filter((m) => m.status === 'done').length;
  const total = week.matches.length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

/** Consecutive fully-adhered (100%) weeks immediately before the current,
 * in-progress week. Documented here as an explicit product rule per the
 * spec review — the exported prototype computed this but never wrote
 * down the definition (see chats/chat1.md review). */
export function computeStreak(weeks: Week[]): number {
  let streak = 0;
  for (let i = weeks.length - 2; i >= 0; i--) {
    if (computeAdherence(weeks[i]).pct === 100) streak++;
    else break;
  }
  return streak;
}
