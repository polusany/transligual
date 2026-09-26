import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_SERVER_URL = (process.env.API_INTERNAL_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');
const FORWARDED_REQUEST_HEADERS = ['accept', 'content-type', 'cookie', 'idempotency-key', 'range', 'x-forwarded-for'];
const FORWARDED_RESPONSE_HEADERS = ['accept-ranges', 'content-disposition', 'content-length', 'content-range', 'content-type', 'cache-control', 'etag', 'retry-after', 'set-cookie', 'x-content-type-options'];

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

  const upstream = await fetch(upstreamUrl, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer(),
    cache: 'no-store',
    redirect: 'manual',
  });
  const responseHeaders = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
