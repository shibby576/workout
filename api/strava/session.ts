import {
  ensureFreshTokens,
  fetchActivityDetail,
  fetchActivityStreams,
  parseCookies,
  type ApiRequest,
  type ApiResponse,
} from './_lib';

// Returns the rich per-session data for one activity: full detail (splits,
// laps, power flags) plus the time-series streams. This is the raw input to the
// structuring step — no transformation happens here.
export default async function handler(req: ApiRequest, res: ApiResponse) {
  const id = req.query.id;
  if (typeof id !== 'string' || !/^\d+$/.test(id)) {
    res.status(400).json({ error: 'missing_or_invalid_id' });
    return;
  }

  const cookies = parseCookies(req.headers.cookie);
  const tokens = await ensureFreshTokens(cookies, res);
  if (!tokens) {
    res.status(401).json({ error: 'not_connected' });
    return;
  }

  try {
    // Streams are best-effort: Strava returns 404/400 for activities with
    // incomplete data (manual entries, some treadmill/stationary work). That
    // must not fail the whole request — structuring degrades to summary fields
    // and reports streamResolution: 'summary-only'.
    const [detail, streams] = await Promise.all([
      fetchActivityDetail(tokens.accessToken, id),
      fetchActivityStreams(tokens.accessToken, id).catch((err) => {
        console.warn(`No streams for activity ${id}:`, err instanceof Error ? err.message : err);
        return {};
      }),
    ]);
    res.status(200).json({ detail, streams });
  } catch (err) {
    console.error('Strava session pull failed', err);
    res.status(502).json({ error: 'strava_fetch_failed' });
  }
}
