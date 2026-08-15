// WorkoutSource — the ingestion abstraction. v1 ships a single Strava
// implementation, but structuring and generation only ever see this interface,
// so a Garmin/Whoop/Oura source can slot in later without touching them.

import type { RawSession, StravaActivitySummary, StravaProfile } from './stravaTypes.js';

export interface WorkoutSource {
  readonly id: 'strava';
  /** Recent cardio activities, newest first — for the select screen. */
  listActivities(): Promise<StravaActivitySummary[]>;
  /** Rich per-session data (detail + streams) for one activity. */
  getSession(activityId: string): Promise<RawSession>;
  /** Athlete zones + FTP for the one-time setup gate. */
  getProfile(): Promise<StravaProfile>;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (res.status === 401) throw new Error('not_connected');
  if (!res.ok) throw new Error(`request_failed:${res.status}`);
  return (await res.json()) as T;
}

// Accepts either a bare Strava id or our namespaced "strava-123" form.
function stravaActivityId(activityId: string): string {
  return activityId.replace(/^strava-/, '');
}

export const stravaSource: WorkoutSource = {
  id: 'strava',
  listActivities: () =>
    getJson<{ activities: StravaActivitySummary[] }>('/api/strava/list').then((r) => r.activities),
  getSession: (activityId) =>
    getJson<RawSession>(`/api/strava/session?id=${encodeURIComponent(stravaActivityId(activityId))}`),
  getProfile: () => getJson<StravaProfile>('/api/strava/profile'),
};
