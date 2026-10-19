// Run from the repository root with Node 22.6+: pnpm translation:check
// Set GOOGLE_TRANSLATE_API_KEY in apps/api/.env or the backend environment.
// An optional website origin also checks the public API proxy:
// pnpm translation:check -- https://your-website.example
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const envFile = fileURLToPath(new URL('../apps/api/.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);
const key = process.env.GOOGLE_TRANSLATE_API_KEY?.trim();
const website = process.argv.slice(2).find(value => value !== '--');

async function main() {
  if (!key) throw new Error('Set GOOGLE_TRANSLATE_API_KEY in apps/api/.env or the backend environment. See docs/TRANSLATION_SETUP.md.');
  const samples = [
    { label: 'English to French', text: 'Hello, how are you?', sourceLanguage: 'en', targetLanguage: 'fr' },
    { label: 'Automatic source detection', text: 'Bonjour, comment allez-vous ?', targetLanguage: 'en' },
    { label: 'French to Arabic', text: 'Bonjour et bienvenue.', sourceLanguage: 'fr', targetLanguage: 'ar' },
  ];
  for (const { label, text, sourceLanguage, targetLanguage } of samples) {
    const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key },
      body: JSON.stringify({ q: text, target: targetLanguage, ...(sourceLanguage ? { source: sourceLanguage } : {}), format: 'text' }),
      signal: AbortSignal.timeout(15000), redirect: 'error',
    });
    // Do not print upstream messages, keys, or configuration values.
    if (!response.ok) {
      const hints = { 400: 'Check the API key and enabled Cloud Translation API.', 401: 'Check the API key.', 403: 'Check billing, API enablement, and API-key restrictions.', 429: 'Check Cloud Translation quotas and usage limits.' };
      throw new Error(`Google returned HTTP ${response.status}. ${hints[response.status] || 'Retry and inspect Google Cloud service status.'}`);
    }
    const result = (await response.json())?.data?.translations?.[0];
    if (!result?.translatedText?.trim() || result.translatedText === text || (!sourceLanguage && result.detectedSourceLanguage !== 'fr'))
      throw new Error(`${label}: unexpected translation response.`);
    console.log(`PASS ${label}`);
  }
  if (website) {
    const origin = new URL(website);
    if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/' || !['http:', 'https:'].includes(origin.protocol))
      throw new Error('Supply only the website origin, such as https://your-website.example.');
    const response = await fetch(new URL('/api/v1/translations/translate', origin), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Good morning', sourceLanguage: 'en', targetLanguage: 'fr' }),
      signal: AbortSignal.timeout(25000), redirect: 'error',
    });
    const body = await response.json().catch(() => null);
    const result = body?.data ?? body;
    if (!response.ok || !result?.translatedText?.trim() || result.targetLanguage !== 'fr')
      throw new Error(`Website translation failed (HTTP ${response.status}). Configure the key on the API host, restart the API, and check the proxy and database.`);
    console.log('PASS website translation through the API proxy');
  }
  console.log('Provider checks passed. Verify language swapping and Copy in the browser.');
}
main().catch(error => {
  console.error('FAIL translation setup: ' + (error instanceof Error ? error.message : 'Unable to verify translation.'));
  process.exitCode = 1;
});
