// Read-only local checks. No credentials or response bodies are printed.
const api = (process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000/api/v1').replace(/\/$/, '');
const web = (process.env.WEB_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const checks = [
  ['API', `${api}/health`, 'Keep pnpm dev running; inspect the API startup output.'],
  ['Database readiness', `${api}/health/ready`, 'Check docker compose ps and the API database configuration/migrations.'],
  ['Website API proxy', `${web}/api/v1/health/ready`, 'Check the web process and its API_INTERNAL_URL setting.'],
];
await Promise.all(checks.map(async ([label, url, hint]) => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: 'error' });
    const body = await response.json();
    if (!response.ok || body.success !== true || !['ok', 'ready'].includes(body.data?.status)) throw new Error(`Unexpected health response (HTTP ${response.status})`);
    console.log(`PASS ${label}`);
  } catch {
    process.exitCode = 1;
    console.error(`FAIL ${label}: ${hint}`);
  }
}));
