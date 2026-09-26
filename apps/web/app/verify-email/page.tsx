'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

export default function VerifyEmailPage() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get('token');
    if (!value) return;
    window.history.replaceState({}, '', window.location.pathname);
    setToken(value);
    setBusy(true);
    apiRequest<{ message: string }>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token: value }) })
      .then((result) => setNotice(result.message))
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'This verification link could not be used.'))
      .finally(() => setBusy(false));
  }, []);

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const result = await apiRequest<{ message: string }>('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) });
      setNotice(result.message);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'The request could not be completed.'); }
    finally { setBusy(false); }
  }

  return <main className="page-shell"><div className="form-page"><aside className="form-aside"><p className="eyebrow">Account security</p><h1>One quick email check.</h1><p>Confirm your email address so we can protect your account and help you recover access if needed.</p></aside><section className="form-card"><p className="eyebrow">Email verification</p><h2>{token ? 'Confirming your email' : 'Resend your verification link'}</h2>{busy && <p role="status">Please wait…</p>}{!token && <form onSubmit={resend}><label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} /></label><button className="button" disabled={busy}>{busy ? 'Sending…' : 'Send verification link'}</button></form>}{error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}<p className="hint"><Link className="text-link" href="/login">Return to sign in →</Link></p></section></div></main>;
}
