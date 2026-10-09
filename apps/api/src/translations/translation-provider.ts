import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import type { TranslateTextDto } from './dto/translate-text.dto';

export async function translateWithGoogle(input: TranslateTextDto) {
  if (!input.text.trim()) throw new BadRequestException('Enter some text to translate.');
  if (input.sourceLanguage === input.targetLanguage) throw new BadRequestException('Choose two different languages.');
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) throw new ServiceUnavailableException('Automatic translation is not available yet. Please try again later.');
  let response: Response;
  try {
    response = await fetch('https://translation.googleapis.com/language/translate/v2', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key },
      body: JSON.stringify({ q: input.text, target: input.targetLanguage, ...(input.sourceLanguage ? { source: input.sourceLanguage } : {}), format: 'text' }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch { throw new ServiceUnavailableException('Translation took too long or could not connect. Please try again.'); }
  if (!response.ok) throw new ServiceUnavailableException('Translation is temporarily unavailable. Please try again shortly.');
  const payload = await response.json().catch(() => null) as { data?: { translations?: { translatedText?: string; detectedSourceLanguage?: string }[] } } | null;
  const result = payload?.data?.translations?.[0];
  if (!result || typeof result.translatedText !== 'string' || !result.translatedText.trim()) throw new ServiceUnavailableException('No translation was returned. Please try again.');
  // Google's plain-text output may contain escaped entities. Decode once; render as text, never HTML.
  const translatedText = result.translatedText.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (match, entity: string) => {
    const named: Record<string,string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
    if (!entity.startsWith('#')) return named[entity.toLowerCase()] ?? match;
    const code = entity.toLowerCase().startsWith('#x') ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : match;
  });
  return { translatedText, sourceLanguage: input.sourceLanguage || result.detectedSourceLanguage || null, targetLanguage: input.targetLanguage };
}
