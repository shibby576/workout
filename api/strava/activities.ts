import { ensureFreshTokens, fetchActivities, parseCookies, type ApiRequest, type ApiResponse } from './_lib';
import type { Workout } from '../../src/types';

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  start_date_local: string;
  distance: number; // meters
  moving_time: number; // seconds
  average_heartrate?: number;
}

const METERS_PER_MILE = 1609.344;
// Lifting/conditioning is Hevy-logged and synced into Strava — these are
// the activity types that arrive that way per the routine spec. Everything
// else is native Strava cardio.
const HEVY_SOURCED_TYPES = new Set(['WeightTraining', 'Workout']);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function toWorkout(activity: StravaActivity): Workout {
  const isHevySourced = HEVY_SOURCED_TYPES.has(activity.type);
  const base = {
    id: `strava-${activity.id}`,
    source: (isHevySourced ? 'Hevy' : 'Strava') as Workout['source'],
    name: activity.name,
    date: formatDate(activity.start_date_local),
  };

  if (isHevySourced) {
    // Structured sets/reps/weight requires parsing Hevy's text description
    // embedded in the Strava activity — not implemented yet (separate,
    // deliberately deferred per the spec's own risk list). Duration +
    // name is an honest stand-in until that parser exists.
    return {
      ...base,
      conditioning: {
        durationMin: Math.round(activity.moving_time / 60),
        avgHr: activity.average_heartrate,
        notes: activity.name,
      },
    };
  }

  const distanceMi = activity.distance / METERS_PER_MILE;
  return {
    ...base,
    cardio: {
      distanceMi: Math.round(distanceMi * 10) / 10,
      avgPaceMinPerMi: distanceMi > 0 ? activity.moving_time / 60 / distanceMi : 0,
      avgHr: activity.average_heartrate,
    },
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const cookies = parseCookies(req.headers.cookie);
  const tokens = await ensureFreshTokens(cookies, res);
  if (!tokens) {
    res.status(401).json({ error: 'not_connected' });
    return;
  }

  try {
    const raw = (await fetchActivities(tokens.accessToken)) as StravaActivity[];
    res.status(200).json({ workouts: raw.map(toWorkout) });
  } catch (err) {
    console.error('Strava activity pull failed', err);
    res.status(502).json({ error: 'strava_fetch_failed' });
  }
}
