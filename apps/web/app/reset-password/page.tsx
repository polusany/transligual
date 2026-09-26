'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';
    if (value) window.history.replaceState({}, '', window.location.pathname);
    setToken(value);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    const form = new FormData(event.currentTarget);
    try {
      if (token && form.get('password') !== form.get('confirmPassword')) {
        setError('The passwords do not match.');
        return;
      }
      const result = token
        ? await apiRequest<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password: form.get('password') }) })
        : await apiRequest<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      setNotice(result.message);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'The request could not be completed.'); }
    finally { setBusy(false); }
  }

  return <main className="page-shell"><div className="form-page"><aside className="form-aside"><p className="eyebrow">Account recovery</p><h1>Get back to learning.</h1><p>We’ll email a short-lived secure link so you can set a new password.</p></aside><section className="form-card"><p className="eyebrow">Password reset</p><h2>{token ? 'Choose a new password' : 'Request a reset link'}</h2><form onSubmit={submit}>{token ? <><label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /><small>Use at least 12 characters.</small></label><label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label></> : <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} /></label>}{error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}<button className="button" disabled={busy}>{busy ? 'Please wait…' : token ? 'Change password' : 'Email me a reset link'}</button></form><p className="hint"><Link className="text-link" href="/login">Return to sign in →</Link></p></section></div></main>;
}
