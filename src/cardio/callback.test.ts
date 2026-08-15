import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import handler from '../../api/strava/callback';
import { safeReturnPath } from './returnPath';

function mockRes() {
  const r: any = { redirects: [] as string[] };
  r.status = () => r; r.json = () => {}; r.setHeader = () => {}; r.end = () => {};
  r.redirect = (_c: number, url: string) => r.redirects.push(url);
  return r;
}

describe('return-path validation', () => {
  // The handler keeps a local copy of this logic so the deployed function has
  // no runtime imports from outside /api; these assertions pin the shared
  // reference implementation the handler mirrors.
  it('accepts a same-origin path and rejects other origins', () => {
    assert.equal(safeReturnPath('/cardio.html'), '/cardio.html');
    for (const evil of ['//evil.com', '/\\evil.com', 'https://evil.com', 'javascript:alert(1)', undefined, 42]) {
      assert.equal(safeReturnPath(evil as unknown), '/', `should reject ${String(evil)}`);
    }
  });
});

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
