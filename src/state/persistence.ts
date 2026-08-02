import type { RoutineItem, Week } from '../types';

const STORAGE_KEY = 'fitness-tracker.v1';

interface Persisted {
  routineItems: RoutineItem[];
  weeks: Week[];
}

export function loadPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.routineItems) || !Array.isArray(parsed.weeks)) return null;
    return parsed;
  } catch {
    // Storage disabled (private browsing, quota, etc.) — fall back to the
    // bundled demo data as if this were a first visit.
    return null;
  }
}

export function savePersisted(routineItems: RoutineItem[], weeks: Week[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ routineItems, weeks }));
  } catch {
    // Ignore — nothing useful to do if storage isn't writable.
  }
}
