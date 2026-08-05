import {
  ensureFreshTokens,
  fetchAthlete,
  fetchAthleteZones,
  parseCookies,
  type ApiRequest,
  type ApiResponse,
} from './_lib';

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

  res.status(200).json({ zones, ftp: athlete?.ftp ?? null });
}
