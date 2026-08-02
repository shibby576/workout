import { exchangeCodeForTokens, setTokenCookies, type ApiRequest, type ApiResponse } from './_lib';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const code = req.query.code;
  const error = req.query.error;

  if (error || typeof code !== 'string') {
    res.redirect(302, '/?strava=denied');
    return;
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    setTokenCookies(res, tokens);
    res.redirect(302, '/?strava=connected');
  } catch (err) {
    console.error('Strava token exchange failed', err);
    res.redirect(302, '/?strava=error');
  }
}
