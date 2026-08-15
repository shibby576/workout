// Kept deliberately free of imports so it can be unit-tested directly under
// Node's type stripping, while the serverless handlers that use it stay on
// extensionless specifiers (which is what Vercel's runtime resolves).

/** The page that started the OAuth flow, carried through Strava as `state`.
 *  Validated to a same-origin path so the parameter cannot bounce the athlete
 *  to another site: it must start with a single slash, and must not begin with
 *  "//" or "/\", both of which browsers read as protocol-relative URLs
 *  pointing at another host. */
export function safeReturnPath(state: unknown): string {
  if (typeof state !== 'string' || !state.startsWith('/')) return '/';
  if (state.startsWith('//') || state.startsWith('/\\')) return '/';
  return state;
}

/** Appends a status param to a return path, respecting any existing query. */
export function withStatus(returnTo: string, status: string): string {
  return `${returnTo}${returnTo.includes('?') ? '&' : '?'}strava=${status}`;
}
