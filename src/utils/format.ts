import type { Workout } from '../types';

function formatPace(minPerMi: number): string {
  const min = Math.floor(minPerMi);
  const sec = Math.round((minPerMi - min) * 60);
  return `${min}:${String(sec).padStart(2, '0')}`;
}

/** Renders a workout's structured metrics as the single display line the
 * UI shows. The structure survives underneath for later phases (see
 * types.ts); this is purely a presentation step. */
export function formatWorkoutMetrics(workout: Workout): string {
  if (workout.cardio) {
    const { distanceMi, avgPaceMinPerMi, avgHr } = workout.cardio;
    const parts = [`${distanceMi}mi`, `${formatPace(avgPaceMinPerMi)}/mi`];
    if (avgHr) parts.push(`avg HR ${avgHr}`);
    return parts.join(' · ');
  }
  if (workout.lift) {
    return workout.lift.map((s) => `${s.exercise} ${s.sets}x${s.reps} @${s.weightLb}`).join(' · ');
  }
  if (workout.conditioning) {
    const { durationMin, avgHr, notes } = workout.conditioning;
    const parts = [`${durationMin} min`, notes];
    if (avgHr) parts.push(`avg HR ${avgHr}`);
    return parts.join(' · ');
  }
  return '';
}
