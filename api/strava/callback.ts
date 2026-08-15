// NOTE: imports here must stay extensionless. Vercel compiles these functions
// to JavaScript and resolves specifiers at runtime, so a "./_lib.ts" specifier
// crashes the deployed function with FUNCTION_INVOCATION_FAILED even though
// bundlers and Node's type stripping both accept it. The validation logic lives
// in ../../src/cardio/returnPath so it can still be unit-tested directly.
import { exchangeCodeForTokens, setTokenCookies, type ApiRequest, type ApiResponse } from './_lib';
import { safeReturnPath, withStatus } from '../../src/cardio/returnPath';

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
