import { clearTokenCookies, type ApiRequest, type ApiResponse } from './_lib.js';

export default async function handler(_req: ApiRequest, res: ApiResponse) {
  clearTokenCookies(res);
  res.redirect(302, '/');
}
