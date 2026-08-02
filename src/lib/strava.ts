import type { Workout } from '../types';

export function getStravaAuthorizeUrl(): string {
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_STRAVA_CLIENT_ID,
    redirect_uri: `${window.location.origin}/api/strava/callback`,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'activity:read_all',
  });
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

export function isStravaConnected(): boolean {
  return document.cookie.split('; ').some((c) => c === 'strava_connected=1');
}

export async function fetchStravaActivities(): Promise<Workout[]> {
  const res = await fetch('/api/strava/activities');
  if (res.status === 401) throw new Error('not_connected');
  if (!res.ok) throw new Error('fetch_failed');
  const data = await res.json();
  return data.workouts;
}
