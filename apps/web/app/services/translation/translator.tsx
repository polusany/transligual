'use client';

import { FormEvent, useState } from 'react';
import { apiRequest } from '../../lib/api';

const LANGUAGES = [
  ['ar', 'Arabic'], ['de', 'German'], ['en', 'English'], ['es', 'Spanish'], ['fr', 'French'],
  ['ha', 'Hausa (experimental)'], ['ig', 'Igbo (experimental)'], ['it', 'Italian'], ['ja', 'Japanese'], ['pt', 'Portuguese'],
  ['sw', 'Swahili'], ['tr', 'Turkish'], ['yo', 'Yoruba'], ['zh-CN', 'Chinese (Simplified)'],
] as const;

type TranslationResult = { translatedText: string; detectedSourceLanguage: string | null; targetLanguage: string };

export default function Translator() {
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('fr');
  const [text, setText] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function translate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setResult(null); setCopied(false); setBusy(true);
    try {
      setResult(await apiRequest<TranslationResult>('/translations/translate', {
        method: 'POST',
        body: JSON.stringify({ text, sourceLanguage: sourceLanguage || undefined, targetLanguage }),
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Translation could not be completed. Please try again.');
    } finally { setBusy(false); }
  }

  async function copyResult() {
    if (!result) return;
    try { await navigator.clipboard.writeText(result.translatedText); setCopied(true); }
    catch { setError('Clipboard access is unavailable in this browser. Select and copy the translation instead.'); }
  }

  function swapLanguages() {
    if (!sourceLanguage) return;
    setSourceLanguage(targetLanguage); setTargetLanguage(sourceLanguage); setResult(null);
  }

  return <section className="translator-card" aria-labelledby="translator-title">
    <div className="translator-heading"><div><p className="eyebrow">Instant translation</p><h2 id="translator-title">Translate a phrase or passage</h2><p>Choose your languages, enter text, and get a translation immediately.</p></div><span className="translator-mark" aria-hidden="true">文</span></div>
    <form onSubmit={translate}>
      <div className="translator-language-row">
        <label>Translate from<select value={sourceLanguage} onChange={(event) => setSourceLanguage(event.target.value)}><option value="">Detect language</option>{LANGUAGES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
        <button className="translator-swap" type="button" onClick={swapLanguages} disabled={!sourceLanguage} aria-label="Swap source and target languages">⇄</button>
        <label>Translate into<select value={targetLanguage} onChange={(event) => { setTargetLanguage(event.target.value); setResult(null); }}>{LANGUAGES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
      </div>
      <div className="translator-panels">
        <label>Original text<textarea value={text} onChange={(event) => { setText(event.target.value); setResult(null); }} maxLength={5000} rows={8} placeholder="Type or paste text to translate…" required /></label>
        <div className="translator-output"><div className="translator-output-label">Translation</div>{result ? <><div className="translator-result" aria-live="polite">{result.translatedText}</div><div className="translator-result-actions"><small>{result.detectedSourceLanguage ? `Source detected: ${LANGUAGES.find(([code]) => code === result.detectedSourceLanguage)?.[1] ?? result.detectedSourceLanguage}` : 'Translation ready'}</small><button type="button" className="button-outline" onClick={() => void copyResult()}>{copied ? 'Copied' : 'Copy translation'}</button></div></> : <p className="translator-placeholder">Your translation will appear here.</p>}</div>
      </div>
      <div className="translator-footer"><small>{text.length.toLocaleString()} / 5,000 characters</small><button className="button" type="submit" disabled={busy || !text.trim()}>{busy ? 'Translating…' : 'Translate now'} <span aria-hidden="true">→</span></button></div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
    <p className="translator-note">Machine translation can miss context and nuance. Have important or official text reviewed by a qualified professional.</p>
  </section>;
}
