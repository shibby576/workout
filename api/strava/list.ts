import { ensureFreshTokens, fetchActivities, parseCookies, type ApiRequest, type ApiResponse } from './_lib';

// Cardio sport types the feedback app surfaces. Lifting and everything else is
// filtered out (this app is cardio-only). Distinct from the older routine
// tracker's activity handling — that mapping is left untouched.
const CARDIO_SPORT_TYPES = new Set([
  'Run',
  'TrailRun',
  'VirtualRun',
  'Ride',
  'VirtualRide',
  'GravelRide',
  'MountainBikeRide',
  'Swim',
  'Walk',
  'Hike',
  'Rowing',
  'Elliptical',
  'StairStepper',
]);

interface RawSummary {
  sport_type?: string;
  type?: string;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const cookies = parseCookies(req.headers.cookie);
  const tokens = await ensureFreshTokens(cookies, res);
  if (!tokens) {
    res.status(401).json({ error: 'not_connected' });
    return;
  }

  try {
    const raw = (await fetchActivities(tokens.accessToken, 50)) as RawSummary[];
    const activities = raw.filter((a) => CARDIO_SPORT_TYPES.has(a.sport_type ?? a.type ?? ''));
    res.status(200).json({ activities });
  } catch (err) {
    console.error('Strava list failed', err);
    res.status(502).json({ error: 'strava_fetch_failed' });
  }
}
