// Explicit .ts specifier so this handler is directly testable under Node's
// type stripping; bundlers accept either form.
import { exchangeCodeForTokens, setTokenCookies, type ApiRequest, type ApiResponse } from './_lib.ts';

/** The page that started the OAuth flow, carried through Strava as `state`.
 *  Validated to a same-origin path so the parameter cannot be used to bounce
 *  the athlete to another site: it must start with a single slash, and must not
 *  begin with "//" or "/\" (both of which browsers read as protocol-relative
 *  URLs pointing at another host). */
function safeReturnPath(state: unknown): string {
  if (typeof state !== 'string' || !state.startsWith('/')) return '/';
  if (state.startsWith('//') || state.startsWith('/\\')) return '/';
  return state;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const code = req.query.code;
  const error = req.query.error;
  const returnTo = safeReturnPath(req.query.state);
  const sep = returnTo.includes('?') ? '&' : '?';

  if (error || typeof code !== 'string') {
    res.redirect(302, `${returnTo}${sep}strava=denied`);
    return;
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    setTokenCookies(res, tokens);
    res.redirect(302, `${returnTo}${sep}strava=connected`);
  } catch (err) {
    console.error('Strava token exchange failed', err);
    res.redirect(302, `${returnTo}${sep}strava=error`);
  }
}
