/**
 * Data model.
 *
 * Two decisions here diverge from the exported prototype (project/Fitness
 * Prototype.dc.html), agreed with the user before implementation, so the
 * v1 frontend doesn't need a schema rewrite when later phases land:
 *
 * 1. Workout metrics are structured fields (per-exercise sets/reps/weight,
 *    cardio pace/HR/distance), not a pre-formatted display string. v1 UI
 *    still renders them as a single line via `formatMetrics`, but the
 *    underlying data survives for Phase 2's correctness judgment without
 *    re-parsing text — important given v1 has no historical backfill, so
 *    anything not captured structurally now is gone for good.
 * 2. WorkoutMatch links MANY workouts to one RoutineItem instance, to
 *    natively model a session Strava/Hevy logs as split activities
 *    (e.g. a cross-train logged as a separate run + lift) without a
 *    bolted-on "extra workouts" list.
 */

export type Category = 'cardio' | 'lift' | 'cross-train';
export type CardioSubtype = 'base' | 'threshold' | 'vo2max';
export type MatchTag = CardioSubtype | 'lift' | 'cross-train';
export type Source = 'Strava' | 'Hevy';

export interface LiftSet {
  exercise: string;
  sets: number;
  reps: number;
  weightLb: number;
}

export interface CardioSummary {
  distanceMi: number;
  avgPaceMinPerMi: number;
  /** Not always present — e.g. an easy walk logged without a HR strap. */
  avgHr?: number;
}

export interface ConditioningSummary {
  durationMin: number;
  avgHr?: number;
  /** Free-text move list ("12 KB swings, 10 box jumps") — circuit-style
   * session content is too varied to force into fixed fields for v1. */
  notes: string;
}

export interface Workout {
  id: string;
  source: Source;
  name: string;
  /** Display date, e.g. "Jul 27". */
  date: string;
  cardio?: CardioSummary;
  lift?: LiftSet[];
  conditioning?: ConditioningSummary;
}

export interface RoutineItem {
  id: string;
  category: Category;
  subtype?: CardioSubtype;
  label: string;
  target: number;
  /** Reserved for Phase 4 (AI-generated workout prescriptions —
   * target exercises/pace/HR bands, not just a target frequency).
   * Always null in v1; kept so the field can be populated later without
   * restructuring RoutineItem. */
  prescription: null;
}

export type MatchStatus = 'open' | 'done';

export interface WorkoutMatch {
  id: string;
  routineItemId: string;
  status: MatchStatus;
  /** Every raw activity counted toward this slot. Length > 1 for a
   * composite session (e.g. cross-train logged as run + lift). */
  workouts: Workout[];
  tag: MatchTag | null;
  needsTag: boolean;
  confirmed: boolean;
}

export interface Week {
  id: string;
  label: string;
  current: boolean;
  matches: WorkoutMatch[];
  unmatched: Workout[];
}

export interface Adherence {
  done: number;
  total: number;
  pct: number;
}
