import {
  ensureFreshTokens,
  fetchActivities,
  fetchAthlete,
  fetchAthleteZones,
  parseCookies,
  type ApiRequest,
  type ApiResponse,
} from './_lib.js';

// Athlete zones + FTP for the one-time setup gate. Both require the
// profile:read_all OAuth scope; when it's absent (or the athlete hasn't set
// custom zones), the calls reject and we return nulls so the client falls back
// to a one-time max-HR entry rather than failing the whole flow.
export default async function handler(req: ApiRequest, res: ApiResponse) {
  const cookies = parseCookies(req.headers.cookie);
  const tokens = await ensureFreshTokens(cookies, res);
  if (!tokens) {
    res.status(401).json({ error: 'not_connected' });
    return;
  }

  const zones = await fetchAthleteZones(tokens.accessToken).catch(() => null);
  const athlete = (await fetchAthlete(tokens.accessToken).catch(() => null)) as { ftp?: number | null } | null;

  // Strava exposes no max-HR field on the athlete, but every activity carries
  // max_heartrate. The highest actually recorded across recent training is a
  // far better anchor than 220-age (which carries a ~10-12bpm standard
  // deviation — routinely a full zone out). Used to seed the setup field,
  // which stays editable.
  // 200 rather than 100: this athlete's hardest efforts (195, 192 bpm) sat
  // outside the most recent 100 activities, so a shorter window under-reported
  // max HR by ~9bpm — enough to shift every zone boundary.
  const observedMaxHr = await fetchActivities(tokens.accessToken, 200)
    .then((activities) => {
      const maxima = (activities as { max_heartrate?: number }[])
        .map((a) => a.max_heartrate)
        .filter((hr): hr is number => typeof hr === 'number' && hr > 0);
      return maxima.length ? Math.max(...maxima) : null;
    })
    .catch(() => null);

  res.status(200).json({ zones, ftp: athlete?.ftp ?? null, observedMaxHr });
}
