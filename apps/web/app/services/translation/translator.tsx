'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { apiRequest } from '../../lib/api';
import TranslationRequests from '../../components/translation-requests';
import LanguageSelect from '../../components/language-select';
export default function Translator() {
  const [sourceLanguage, setSource] = useState('English');
  const [targetLanguage, setTarget] = useState('French');
  const [sourceText, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refresh, setRefresh] = useState(0);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try { await apiRequest('/translations/requests', { method: 'POST', body: JSON.stringify({ sourceLanguage, targetLanguage, sourceText }) }); setText(''); setMessage('Request sent. An administrator will review your text and reply here.'); setRefresh(n => n + 1); }
    catch(e) { setError(e instanceof Error ? e.message : 'Request could not be sent.'); }
    finally { setBusy(false); }
  }
  return <><section className="translator-card"><h2>Request a text translation</h2><p>Choose your languages and paste up to 5,000 characters. An administrator will respond in your request history below.</p><p><Link href="/login">Sign in</Link> to submit a request and read your replies.</p><form onSubmit={submit}>
    <div className="manual-language-row"><LanguageSelect label="Source language" name="sourceLanguage" value={sourceLanguage} onChange={setSource} /><LanguageSelect label="Target language" name="targetLanguage" value={targetLanguage} onChange={setTarget} /></div>
    <label htmlFor="translation-source-text">Text to translate</label><textarea id="translation-source-text" value={sourceText} onChange={e => setText(e.target.value)} maxLength={5000} rows={8} required placeholder="Type or paste your text here…" />
    <div className="translator-footer"><small>{sourceText.length.toLocaleString()} / 5,000 characters · Text only</small><button className="button" disabled={busy || !sourceText.trim()}>{busy ? 'Submitting…' : 'Submit request'}</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
  </form></section><TranslationRequests refresh={refresh} /></>;
}
