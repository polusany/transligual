'use client';
import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

type Request = { id: string; sourceLanguage: string; targetLanguage: string; sourceText: string | null; translatedText: string | null; status: string; createdAt: string; repliedAt: string | null; customer?: { email: string } };
function ReplyForm({ item, onReply }: { item: Request; onReply: () => void }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try { await apiRequest(`/admin/translations/${item.id}/reply`, { method: 'POST', body: JSON.stringify({ translatedText: text }) }); onReply(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Reply could not be sent.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit}><label htmlFor={`reply-${item.id}`}>Your translated reply</label><textarea id={`reply-${item.id}`} value={text} onChange={e => setText(e.target.value)} rows={6} maxLength={20000} required /><button className="button" disabled={busy || !text.trim()}>{busy ? 'Sending…' : 'Send reply'}</button>{error && <p className="form-error" role="alert">{error}</p>}</form>;
}
export default function TranslationRequests({ admin = false, refresh = 0 }: { admin?: boolean; refresh?: number }) {
  const [items, setItems] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await apiRequest<Request[]>(admin ? '/admin/translations' : '/translations/requests/me')); }
    catch (e) { setError(e instanceof Error ? e.message : 'Requests could not be loaded.'); }
    finally { setLoading(false); }
  }, [admin]);
  useEffect(() => { void load(); }, [load, refresh]);
  return <section className="manual-requests" aria-labelledby="translation-requests-title"><div className="section-heading"><h2 id="translation-requests-title">{admin ? 'Translation inbox' : 'Your requests & replies'}</h2><button className="button-outline" onClick={() => void load()} disabled={loading}>Refresh</button></div>
    {loading ? <p role="status">Loading requests…</p> : error ? <div role="alert"><p className="form-error">{error}</p><Link href={admin ? '/admin/login' : '/login'}>Sign in</Link></div> : !items.length ? <p>{admin ? 'No translation requests yet.' : 'Your submitted text and admin replies will appear here.'}</p> : <div className="request-list">{items.map(item => <article className="manual-request" key={item.id}>
      <div className="section-heading"><h3>{item.sourceLanguage} → {item.targetLanguage}</h3><span className="pill">{item.status === 'COMPLETED' ? 'Answered' : item.status === 'REQUESTED' ? 'Awaiting admin' : item.status.replaceAll('_', ' ')}</span></div>
      <p><small>Submitted {new Date(item.createdAt).toLocaleString()}{admin && item.customer ? ` · ${item.customer.email}` : ''}</small></p><h4>Original text</h4><p className="manual-text">{item.sourceText ?? 'This older request has no text. Submit a new text request.'}</p>
      {item.translatedText && <div className="manual-reply"><h4>Admin reply</h4><p className="manual-text">{item.translatedText}</p>{item.repliedAt && <small>Answered {new Date(item.repliedAt).toLocaleString()}</small>}</div>}
      {admin && item.status === 'REQUESTED' && item.sourceText && <ReplyForm item={item} onReply={() => void load()} />}
    </article>)}</div>}
  </section>;
}
