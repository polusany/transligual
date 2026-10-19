'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { apiRequest } from '../../lib/api';

const languages = [['en', 'English'], ['fr', 'French'], ['ar', 'Arabic'], ['zh-CN', 'Chinese (Simplified)'], ['de', 'German'], ['ha', 'Hausa'], ['ig', 'Igbo'], ['it', 'Italian'], ['pt', 'Portuguese'], ['es', 'Spanish'], ['yo', 'Yoruba']] as const;
type Result = { translatedText: string; sourceLanguage: string | null; targetLanguage: string };
const languageName = (code: string | null) => languages.find(([id]) => id === code)?.[1] || code || 'Detected language';

export default function Translator() {
  const [source, setSource] = useState('auto');
  const [target, setTarget] = useState('fr');
  const [text, setText] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const requestVersion = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => () => { requestVersion.current++; activeRequest.current?.abort(); }, []);

  function invalidate() {
    requestVersion.current++;
    activeRequest.current?.abort();
    activeRequest.current = null;
    setBusy(false);
    setResult(null);
    setError('');
    setNotice('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeRequest.current || !text.trim()) return;
    if (source === target) { setError('Choose two different languages.'); return; }
    const version = ++requestVersion.current;
    const controller = new AbortController();
    activeRequest.current = controller;
    setBusy(true); setError(''); setNotice(''); setResult(null);
    try {
      const output = await apiRequest<Result>('/translations/translate', {
        method: 'POST', signal: controller.signal,
        body: JSON.stringify({ text, targetLanguage: target, ...(source === 'auto' ? {} : { sourceLanguage: source }) }),
      });
      if (version === requestVersion.current) setResult(output);
    } catch (e) {
      if (version === requestVersion.current && !controller.signal.aborted)
        setError(e instanceof Error ? e.message : 'Translation could not be completed. Please try again.');
    } finally {
      if (version === requestVersion.current) { activeRequest.current = null; setBusy(false); }
    }
  }

  const detectedSource = source === 'auto' ? result?.sourceLanguage : source;
  const canSwap = !!detectedSource && languages.some(([id]) => id === detectedSource);
  function swap() {
    if (!canSwap || !detectedSource) return;
    setSource(target); setTarget(detectedSource);
    if (result) setText(result.translatedText);
    invalidate();
  }
  async function copy() {
    if (!result) return;
    const version = requestVersion.current;
    try {
      await navigator.clipboard.writeText(result.translatedText);
      if (version === requestVersion.current) setNotice('Translation copied.');
    } catch {
      if (version === requestVersion.current) setNotice('Select the translation text to copy it.');
    }
  }

  return <section className="translator-card instant-translator" aria-labelledby="translator-title">
    <div className="instant-heading"><div><p className="eyebrow">Translation bot</p><h2 id="translator-title">Translate your text</h2></div><span className="pill">Automatic translation</span></div>
    <p>Choose your languages, enter your text, and select Translate. No sign-in is needed.</p>
    <form onSubmit={submit} aria-busy={busy}>
      <div className="instant-languages">
        <label>From<select value={source} onChange={e => { setSource(e.target.value); invalidate(); }}><option value="auto">Detect language</option>{languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
        <button className="button-outline instant-swap" type="button" aria-label="Swap source and target languages" title={canSwap ? 'Swap languages' : 'Translate first to detect the source language'} onClick={swap} disabled={!canSwap}>{'\u21c4'}</button>
        <label>To<select value={target} onChange={e => { setTarget(e.target.value); invalidate(); }}>{languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
      </div>
      <div className="instant-panels">
        <div><label htmlFor="translation-source">Text to translate</label><textarea id="translation-source" value={text} onChange={e => { setText(e.target.value); invalidate(); }} rows={9} maxLength={5000} required dir="auto" aria-describedby="translation-count" placeholder="Type or paste your text here…" />
          <div className="instant-text-actions"><small id="translation-count">{text.length.toLocaleString()} / 5,000 characters</small><button className="text-button" type="button" disabled={!text} onClick={() => { setText(''); invalidate(); }}>Clear</button></div></div>
        <div><label htmlFor="translation-result">Translation</label><textarea id="translation-result" value={result?.translatedText || ''} readOnly rows={9} dir="auto" lang={result?.targetLanguage || target} placeholder={busy ? 'Translating…' : 'Your translation will appear here.'} aria-busy={busy} />
          {result && <div className="instant-text-actions"><small>{languageName(result.sourceLanguage)} {'\u2192'} {languageName(result.targetLanguage)}</small><button className="button-outline" type="button" onClick={copy}>Copy translation</button></div>}</div>
      </div>
      <div className="translator-footer"><small>Text is sent to Google Cloud Translation. Transligual does not save your automatic translations.</small><button className="button" disabled={busy || !text.trim()}>{busy ? 'Translating…' : 'Translate →'}</button></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <p className="sr-only" role="status">{busy ? 'Translating your text.' : result ? 'Translation ready.' : ''}</p>
      {notice && <p role="status">{notice}</p>}
    </form>
  </section>;
}
