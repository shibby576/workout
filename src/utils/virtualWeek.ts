import type { RoutineItem, Week, WorkoutMatch } from '../types';

/** A read-only "week" synthesized straight from the active routine when no
 * real week exists yet (first run: routine defined, nothing logged/synced
 * against it so far — real build would create this once Strava starts
 * pulling activities). One open slot per target unit, mirroring how the
 * mock weeks lay out multi-target items (e.g. "Lift x2" → two slots). */
export function buildVirtualWeek(routineItems: RoutineItem[]): Week {
  const matches: WorkoutMatch[] = [];
  routineItems.forEach((item) => {
    for (let i = 0; i < item.target; i++) {
      matches.push({
        id: `virtual-${item.id}-${i}`,
        routineItemId: item.id,
        status: 'open',
        workouts: [],
        tag: null,
        needsTag: false,
        confirmed: true,
      });
    }
  });
  return {
    id: 'virtual-current',
    label: 'This week',
    current: true,
    matches,
    unmatched: [],
  };
}
