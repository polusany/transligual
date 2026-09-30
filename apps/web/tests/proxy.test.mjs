import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GET, POST, HEAD, OPTIONS } from '../app/api/v1/[...path]/route.ts';

const context = { params: Promise.resolve({ path: ['health'] }) };
function request(method = 'GET', headers = {}) {
  const req = new Request('http://localhost:3000/api/v1/health?check=1', { method, headers });
  req.nextUrl = new URL(req.url);
  return req;
}

test('proxy regression cases', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  t.after(() => { globalThis.fetch = originalFetch; console.error = originalError; });
  await t.test('unreachable API returns a non-cacheable 503 and safe diagnostics', async () => {
    let diagnostic;
    console.error = (...args) => { diagnostic = args; };
    globalThis.fetch = async () => { throw new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } }); };
    const response = await GET(request(), context);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await response.json()).error.code, 'API_UNAVAILABLE');
    assert.equal(diagnostic[1].code, 'ECONNREFUSED');
  });
  await t.test('upstream timeout is distinguished from connection failure', async () => {
    globalThis.fetch = async () => { throw new DOMException('timed out', 'TimeoutError'); };
    const response = await GET(request(), context);
    assert.equal(response.status, 504);
    assert.equal((await response.json()).error.code, 'API_TIMEOUT');
  });
  await t.test('redirects and separate cookies are preserved', async () => {
    globalThis.fetch = async () => {
      const headers = new Headers({ location: '/sign-in' });
      headers.append('set-cookie', 'session=one; Path=/; HttpOnly');
      headers.append('set-cookie', 'other=two; Path=/; HttpOnly');
      return new Response(null, { status: 302, headers });
    };
    const response = await GET(request(), context);
    assert.equal(response.headers.get('location'), '/sign-in');
    assert.equal(response.headers.getSetCookie().length, 2);
  });
  await t.test('decompressed responses do not keep compressed content length', async () => {
    globalThis.fetch = async () => new Response('decoded body', { headers: { 'content-encoding': 'gzip', 'content-length': '99' } });
    const response = await GET(request(), context);
    assert.equal(response.headers.get('content-length'), null);
    assert.equal(await response.text(), 'decoded body');
  });
  await t.test('HEAD and OPTIONS reach the backend', async () => {
    const methods = [];
    globalThis.fetch = async (url, options) => { methods.push(options.method); return new Response(null, { status: 204 }); };
    assert.equal((await HEAD(request('HEAD'), context)).body, null);
    assert.equal((await OPTIONS(request('OPTIONS'), context)).status, 204);
    assert.deepEqual(methods, ['HEAD', 'OPTIONS']);
  });
  await t.test('cross-site writes are rejected before contacting the API', async () => {
    globalThis.fetch = async () => { assert.fail('upstream must not be called'); };
    assert.equal((await POST(request('POST', { origin: 'https://untrusted.example' }), context)).status, 403);
  });
});
