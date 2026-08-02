// Minimal request/response shape shared by Vercel's Node functions —
// avoids pulling in @vercel/node purely for types (its build-tooling
// dependency tree carries a handful of ReDoS advisories in packages that
// never run at request time, not worth it for type-checking alone).
export interface ApiRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): void;
  redirect(code: number, url: string): void;
  setHeader(name: string, value: string | string[]): void;
  end(): void;
}

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days — matches Strava refresh-token lifetime in practice

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix seconds
}

export function parseCookies(header: string | string[] | undefined): Record<string, string> {
  const raw = Array.isArray(header) ? header.join('; ') : header || '';
  const out: Record<string, string> = {};
  raw.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

function cookie(name: string, value: string, opts: { httpOnly?: boolean; maxAge?: number } = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'SameSite=Lax', 'Secure'];
  if (opts.httpOnly !== false) parts.push('HttpOnly');
  parts.push(`Max-Age=${opts.maxAge ?? COOKIE_MAX_AGE}`);
  return parts.join('; ');
}

export function setTokenCookies(res: ApiResponse, tokens: TokenSet): void {
  res.setHeader('Set-Cookie', [
    cookie('strava_access_token', tokens.accessToken),
    cookie('strava_refresh_token', tokens.refreshToken),
    cookie('strava_expires_at', String(tokens.expiresAt)),
    // Readable by the frontend (not HttpOnly) purely to show connected
    // state — carries no secret, just a boolean-ish marker.
    cookie('strava_connected', '1', { httpOnly: false }),
  ]);
}

export function clearTokenCookies(res: ApiResponse): void {
  res.setHeader('Set-Cookie', [
    cookie('strava_access_token', '', { maxAge: 0 }),
    cookie('strava_refresh_token', '', { maxAge: 0 }),
    cookie('strava_expires_at', '', { maxAge: 0 }),
    cookie('strava_connected', '', { httpOnly: false, maxAge: 0 }),
  ]);
}

export function readTokensFromCookies(cookies: Record<string, string>): TokenSet | null {
  const accessToken = cookies.strava_access_token;
  const refreshToken = cookies.strava_refresh_token;
  const expiresAt = Number(cookies.strava_expires_at);
  if (!accessToken || !refreshToken || !Number.isFinite(expiresAt)) return null;
  return { accessToken, refreshToken, expiresAt };
}

async function requestTokens(body: Record<string, string>): Promise<TokenSet> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      ...body,
    }),
  });
  if (!res.ok) throw new Error(`Strava token request failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; refresh_token: string; expires_at: number };
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: data.expires_at };
}

export function exchangeCodeForTokens(code: string): Promise<TokenSet> {
  return requestTokens({ code, grant_type: 'authorization_code' });
}

export function refreshTokens(refreshToken: string): Promise<TokenSet> {
  return requestTokens({ refresh_token: refreshToken, grant_type: 'refresh_token' });
}

/** Returns a valid access token, transparently refreshing (and re-issuing
 * cookies) if the current one is expired or about to expire. */
export async function ensureFreshTokens(cookies: Record<string, string>, res: ApiResponse): Promise<TokenSet | null> {
  const tokens = readTokensFromCookies(cookies);
  if (!tokens) return null;
  const nowSec = Math.floor(Date.now() / 1000);
  if (tokens.expiresAt - nowSec > 60) return tokens;
  const refreshed = await refreshTokens(tokens.refreshToken);
  setTokenCookies(res, refreshed);
  return refreshed;
}

export async function fetchActivities(accessToken: string, perPage = 30): Promise<unknown[]> {
  const res = await fetch(`${STRAVA_API_BASE}/athlete/activities?per_page=${perPage}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Strava activities request failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as unknown[];
}
