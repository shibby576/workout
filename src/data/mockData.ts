import type { RoutineItem, Week, WorkoutMatch, Workout } from '../types';

export const initialRoutineItems: RoutineItem[] = [
  { id: 'ri-base', category: 'cardio', subtype: 'base', label: 'Base run', target: 1, prescription: null },
  { id: 'ri-thresh', category: 'cardio', subtype: 'threshold', label: 'Threshold run', target: 1, prescription: null },
  { id: 'ri-vo2', category: 'cardio', subtype: 'vo2max', label: 'VO2max run', target: 1, prescription: null },
  { id: 'ri-lift', category: 'lift', label: 'Lift', target: 2, prescription: null },
  { id: 'ri-cross', category: 'cross-train', label: 'Cross-train', target: 1, prescription: null },
];

let workoutSeq = 0;
function w(partial: Omit<Workout, 'id'>): Workout {
  workoutSeq += 1;
  return { id: 'wk-' + workoutSeq, ...partial };
}

let matchSeq = 0;
function match(
  routineItemId: string,
  opts: Partial<Pick<WorkoutMatch, 'tag' | 'needsTag' | 'confirmed'>> & { workouts?: Workout[] } = {},
): WorkoutMatch {
  matchSeq += 1;
  const workouts = opts.workouts ?? [];
  return {
    id: 'm-' + matchSeq,
    routineItemId,
    status: workouts.length ? 'done' : 'open',
    workouts,
    tag: opts.tag ?? null,
    needsTag: opts.needsTag ?? false,
    confirmed: opts.confirmed ?? true,
  };
}

export const initialWeeks: Week[] = [
  {
    id: 'w0',
    label: 'Jun 29 – Jul 5',
    current: false,
    matches: [
      match('ri-base', { tag: 'base', workouts: [w({ source: 'Strava', name: 'Morning run', date: 'Jun 29', cardio: { distanceMi: 6.1, avgPaceMinPerMi: 9.87, avgHr: 146 } })] }),
      match('ri-thresh', { tag: 'threshold', workouts: [w({ source: 'Strava', name: 'Tempo run', date: 'Jul 1', cardio: { distanceMi: 4.2, avgPaceMinPerMi: 7.47, avgHr: 167 } })] }),
      match('ri-vo2', { tag: 'vo2max', workouts: [w({ source: 'Strava', name: 'Interval run', date: 'Jul 3', cardio: { distanceMi: 3.5, avgPaceMinPerMi: 6.67, avgHr: 178 } })] }),
      match('ri-lift', { tag: 'lift', workouts: [w({ source: 'Hevy', name: 'Lower body', date: 'Jun 30', lift: [{ exercise: 'Squat', sets: 5, reps: 5, weightLb: 215 }, { exercise: 'RDL', sets: 4, reps: 8, weightLb: 185 }] })] }),
      match('ri-lift', { tag: 'lift', workouts: [w({ source: 'Hevy', name: 'Upper body', date: 'Jul 2', lift: [{ exercise: 'Bench', sets: 4, reps: 6, weightLb: 145 }, { exercise: 'Row', sets: 4, reps: 10, weightLb: 115 }] })] }),
      match('ri-cross'),
    ],
    unmatched: [w({ source: 'Strava', name: 'Dog walk', date: 'Jul 4', cardio: { distanceMi: 1.8, avgPaceMinPerMi: 19 } })],
  },
  {
    id: 'w1',
    label: 'Jul 6 – Jul 12',
    current: false,
    matches: [
      match('ri-base', { tag: 'base', workouts: [w({ source: 'Strava', name: 'Morning run', date: 'Jul 6', cardio: { distanceMi: 6.4, avgPaceMinPerMi: 9.67, avgHr: 149 } })] }),
      match('ri-thresh', { tag: 'threshold', workouts: [w({ source: 'Strava', name: 'Tempo run', date: 'Jul 8', cardio: { distanceMi: 4.0, avgPaceMinPerMi: 7.37, avgHr: 169 } })] }),
      match('ri-vo2', { tag: 'vo2max', workouts: [w({ source: 'Strava', name: 'Interval run', date: 'Jul 10', cardio: { distanceMi: 3.6, avgPaceMinPerMi: 6.58, avgHr: 180 } })] }),
      match('ri-lift', { tag: 'lift', workouts: [w({ source: 'Hevy', name: 'Lower body', date: 'Jul 7', lift: [{ exercise: 'Squat', sets: 5, reps: 5, weightLb: 220 }, { exercise: 'RDL', sets: 4, reps: 8, weightLb: 190 }] })] }),
      match('ri-lift', { tag: 'lift', workouts: [w({ source: 'Hevy', name: 'Upper body', date: 'Jul 9', lift: [{ exercise: 'Bench', sets: 4, reps: 6, weightLb: 150 }, { exercise: 'Row', sets: 4, reps: 10, weightLb: 120 }] })] }),
      match('ri-cross', { tag: 'cross-train', workouts: [w({ source: 'Hevy', name: 'EMOM 20', date: 'Jul 11', conditioning: { durationMin: 20, avgHr: 158, notes: '12 KB swings, 10 box jumps' } })] }),
    ],
    unmatched: [],
  },
  {
    id: 'w2',
    label: 'Jul 13 – Jul 19',
    current: false,
    matches: [
      match('ri-base', { tag: 'base', workouts: [w({ source: 'Strava', name: 'Morning run', date: 'Jul 13', cardio: { distanceMi: 6.3, avgPaceMinPerMi: 9.73, avgHr: 147 } })] }),
      match('ri-thresh', { tag: 'threshold', workouts: [w({ source: 'Strava', name: 'Tempo run', date: 'Jul 15', cardio: { distanceMi: 4.1, avgPaceMinPerMi: 7.32, avgHr: 170 } })] }),
      match('ri-vo2', { tag: 'vo2max', workouts: [w({ source: 'Strava', name: 'Interval run', date: 'Jul 17', cardio: { distanceMi: 3.4, avgPaceMinPerMi: 6.63, avgHr: 179 } })] }),
      match('ri-lift', { tag: 'lift', workouts: [w({ source: 'Hevy', name: 'Lower body', date: 'Jul 14', lift: [{ exercise: 'Squat', sets: 5, reps: 5, weightLb: 225 }, { exercise: 'RDL', sets: 4, reps: 8, weightLb: 195 }] })] }),
      match('ri-lift', { tag: 'lift', workouts: [w({ source: 'Hevy', name: 'Upper body', date: 'Jul 16', lift: [{ exercise: 'Bench', sets: 4, reps: 6, weightLb: 150 }, { exercise: 'Row', sets: 4, reps: 10, weightLb: 120 }] })] }),
      match('ri-cross', { tag: 'cross-train', workouts: [w({ source: 'Hevy', name: 'Circuit', date: 'Jul 18', conditioning: { durationMin: 24, avgHr: 161, notes: '5 rounds: burpees, rows, lunges' } })] }),
    ],
    unmatched: [],
  },
  {
    id: 'w3',
    label: 'Jul 20 – Jul 26',
    current: false,
    matches: [
      match('ri-base', { tag: 'base', workouts: [w({ source: 'Strava', name: 'Morning run', date: 'Jul 20', cardio: { distanceMi: 6.5, avgPaceMinPerMi: 9.63, avgHr: 148 } })] }),
      match('ri-thresh', { tag: 'threshold', workouts: [w({ source: 'Strava', name: 'Tempo run', date: 'Jul 22', cardio: { distanceMi: 4.2, avgPaceMinPerMi: 7.25, avgHr: 171 } })] }),
      match('ri-vo2', { tag: 'vo2max', workouts: [w({ source: 'Strava', name: 'Interval run', date: 'Jul 24', cardio: { distanceMi: 3.6, avgPaceMinPerMi: 6.5, avgHr: 181 } })] }),
      match('ri-lift', { tag: 'lift', workouts: [w({ source: 'Hevy', name: 'Lower body', date: 'Jul 21', lift: [{ exercise: 'Squat', sets: 5, reps: 5, weightLb: 225 }, { exercise: 'RDL', sets: 4, reps: 8, weightLb: 195 }] })] }),
      match('ri-lift', { tag: 'lift', workouts: [w({ source: 'Hevy', name: 'Upper body', date: 'Jul 23', lift: [{ exercise: 'Bench', sets: 4, reps: 6, weightLb: 155 }, { exercise: 'Row', sets: 4, reps: 10, weightLb: 125 }] })] }),
      match('ri-cross', { tag: 'cross-train', workouts: [w({ source: 'Hevy', name: 'EMOM 24', date: 'Jul 25', conditioning: { durationMin: 24, avgHr: 163, notes: '12 KB swings, 12 box jumps' } })] }),
    ],
    unmatched: [],
  },
  {
    id: 'w4',
    label: 'Jul 27 – Aug 2',
    current: true,
    matches: [
      match('ri-base', { tag: 'base', confirmed: true, workouts: [w({ source: 'Strava', name: 'Morning run', date: 'Jul 27', cardio: { distanceMi: 6.2, avgPaceMinPerMi: 9.75, avgHr: 148 } })] }),
      match('ri-thresh', { tag: 'threshold', confirmed: false, needsTag: true, workouts: [w({ source: 'Strava', name: 'Run', date: 'Jul 29', cardio: { distanceMi: 4.0, avgPaceMinPerMi: 7.33, avgHr: 168 } })] }),
      match('ri-vo2'),
      match('ri-lift', { tag: 'lift', confirmed: true, workouts: [w({ source: 'Hevy', name: 'Lower body', date: 'Jul 28', lift: [{ exercise: 'Squat', sets: 5, reps: 5, weightLb: 225 }, { exercise: 'RDL', sets: 4, reps: 8, weightLb: 195 }] })] }),
      match('ri-lift', { tag: 'lift', confirmed: false, needsTag: true, workouts: [w({ source: 'Hevy', name: 'Session', date: 'Jul 30', conditioning: { durationMin: 24, avgHr: 160, notes: 'KB swings, box jumps, rows' } })] }),
      match('ri-cross'),
    ],
    unmatched: [
      w({ source: 'Strava', name: 'Walk', date: 'Jul 31', cardio: { distanceMi: 1.6, avgPaceMinPerMi: 18 } }),
      w({ source: 'Strava', name: 'Row intervals', date: 'Jul 30', conditioning: { durationMin: 12, avgHr: 155, notes: 'Rowing intervals' } }),
    ],
  },
];
