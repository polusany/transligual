const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.message ?? body?.error?.message ?? 'Something went wrong. Please try again.';
    throw new Error(Array.isArray(message) ? message[0] : message);
  }
  return body.data as T;
}

export type CurrentUser = { id: string; email: string; profile: { firstName: string; lastName: string; displayName: string | null } | null };
