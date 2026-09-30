import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_SERVER_URL = (process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:4000/api/v1').replace(/\/$/, '');
const FORWARDED_REQUEST_HEADERS = ['accept', 'content-type', 'cookie', 'idempotency-key', 'range', 'x-forwarded-for', 'x-paystack-signature'];
const FORWARDED_RESPONSE_HEADERS = ['accept-ranges', 'content-disposition', 'content-length', 'content-range', 'content-type', 'cache-control', 'etag', 'retry-after', 'location', 'www-authenticate', 'x-content-type-options'];

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path } = await context.params;
  const method = request.method.toUpperCase();
  const origin = request.headers.get('origin');
  const allowedOrigin = process.env.PUBLIC_APP_ORIGIN ?? request.nextUrl.origin;
  const isPaymentWebhook = path[0] === 'payments' && path[1] === 'webhooks';
  if (!isPaymentWebhook && !['GET', 'HEAD', 'OPTIONS'].includes(method) && origin && origin !== allowedOrigin) {
    return Response.json({ success: false, error: { message: 'Cross-site requests are not allowed.' } }, { status: 403 });
  }
  const upstreamUrl = `${API_SERVER_URL}/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;
  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  let upstream: Response;
  try { upstream = await fetch(upstreamUrl, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer(),
    cache: 'no-store',
    redirect: 'manual',
    signal: AbortSignal.timeout(30000),
  }); } catch (error) {
    const cause = error instanceof Error ? error.cause as { code?: string } | undefined : undefined;
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    // Never log request bodies, query strings, cookies, or configured URL credentials.
    console.error('[api-proxy] Upstream request failed', {
      method,
      code: cause?.code ?? (error instanceof Error ? error.name : 'UNKNOWN'),
    });
    return Response.json({ success: false, error: {
      code: timedOut ? 'API_TIMEOUT' : 'API_UNAVAILABLE',
      message: timedOut
        ? 'The service took too long to respond. Please try again shortly.'
        : 'The service is temporarily unavailable. Please try again shortly.',
    } }, { status: timedOut ? 504 : 503, headers: { 'Cache-Control': 'no-store' } });
  }
  const responseHeaders = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    // Fetch decompresses the body, so the compressed length is no longer valid.
    if (name === 'content-length' && upstream.headers.has('content-encoding')) continue;
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append('set-cookie', cookie);
  const body = method === 'HEAD' || [204, 205, 304].includes(upstream.status) ? null : upstream.body;
  return new Response(body, { status: upstream.status, headers: responseHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;

export const HEAD = proxy;
export const OPTIONS = proxy;
