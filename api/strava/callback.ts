// Two constraints learned the hard way, both of which crash the deployed
// function with FUNCTION_INVOCATION_FAILED while passing every local check:
//
//   1. Specifiers need a ".js" extension. Vercel compiles these to JavaScript
//      and package.json sets "type": "module", so the output is ESM — which
//      requires explicit extensions at runtime. TypeScript maps ".js" back to
//      the ".ts" source at compile time, so this is the correct form to write.
//      Extensionless fails with ERR_MODULE_NOT_FOUND; ".ts" fails because the
//      file is gone once compiled.
//   2. The redirect helpers are kept local rather than imported from src/, so
//      this function has no cross-directory runtime dependency to resolve.
import { exchangeCodeForTokens, setTokenCookies, type ApiRequest, type ApiResponse } from './_lib.js';

/** The page that started the OAuth flow, carried through Strava as `state`.
 *  Validated to a same-origin path so the parameter cannot bounce the athlete
 *  to another site: it must start with a single slash, and must not begin with
 *  "//" or "/\", both of which browsers read as protocol-relative URLs pointing
 *  at another host. Mirrored in src/cardio/returnPath.ts, which is where the
 *  unit tests for this logic live. */
function safeReturnPath(state: unknown): string {
  if (typeof state !== 'string' || !state.startsWith('/')) return '/';
  if (state.startsWith('//') || state.startsWith('/\\')) return '/';
  return state;
}

function withStatus(returnTo: string, status: string): string {
  return `${returnTo}${returnTo.includes('?') ? '&' : '?'}strava=${status}`;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const code = req.query.code;
  const error = req.query.error;
  const returnTo = safeReturnPath(req.query.state);

  if (error || typeof code !== 'string') {
    res.redirect(302, withStatus(returnTo, 'denied'));
    return;
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    setTokenCookies(res, tokens);
    res.redirect(302, withStatus(returnTo, 'connected'));
  } catch (err) {
    console.error('Strava token exchange failed', err);
    res.redirect(302, withStatus(returnTo, 'error'));
  }
}
