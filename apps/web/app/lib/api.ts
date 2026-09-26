// Browser requests go through the Next.js same-origin proxy. This keeps the API
// host private and avoids exposing a deployment-specific URL in the client bundle.
const API_URL = '/api/v1';

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_URL}${path}`, { ...options, credentials: 'same-origin', headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.message ?? body?.error?.message ?? 'Something went wrong. Please try again.';
    throw new Error(Array.isArray(message) ? message[0] : message);
  }
  return (body && typeof body === 'object' && 'data' in body ? body.data : body) as T;
}

export type CurrentUser = { id: string; email: string; roles: string[]; status: string; profile: { firstName: string; lastName: string; displayName: string | null } | null };
