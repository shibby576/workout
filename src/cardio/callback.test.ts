import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import handler from '../../api/strava/callback.ts';

function mockRes() {
  const r: any = { redirects: [] as string[] };
  r.status = () => r; r.json = () => {}; r.setHeader = () => {}; r.end = () => {};
  r.redirect = (_c: number, url: string) => r.redirects.push(url);
  return r;
}

describe('oauth callback return path', () => {
  it('returns to the page that started the flow', async () => {
    const res = mockRes();
    await handler({ method: 'GET', query: { error: 'access_denied', state: '/cardio.html' }, headers: {} } as any, res);
    assert.equal(res.redirects[0], '/cardio.html?strava=denied');
  });

  it('defaults to root when no state is given', async () => {
    const res = mockRes();
    await handler({ method: 'GET', query: { error: 'access_denied' }, headers: {} } as any, res);
    assert.equal(res.redirects[0], '/?strava=denied');
  });

  it('refuses to bounce to another origin', async () => {
    for (const evil of ['//evil.com', '/\\evil.com', 'https://evil.com', 'javascript:alert(1)']) {
      const res = mockRes();
      await handler({ method: 'GET', query: { error: 'x', state: evil }, headers: {} } as any, res);
      assert.equal(res.redirects[0], '/?strava=denied', `should not honour ${evil}`);
    }
  });
});
