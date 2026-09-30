const API_SERVER_URL = (process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:4000/api/v1').replace(/\/$/, '');

export function serverApiUrl(path: string): string {
  return `${API_SERVER_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
