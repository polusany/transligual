'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, CurrentUser } from '../../lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
      const user = await apiRequest<CurrentUser>('/auth/me');
      if (!user.roles.some((role) => ['ADMIN', 'SUPER_ADMIN'].includes(role))) {
        await apiRequest('/auth/logout', { method: 'POST' }).catch(() => undefined);
        throw new Error('This account does not have administrator access.');
      }
      router.replace('/admin');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to sign in. Check your details and try again.'); }
    finally { setBusy(false); }
  }

  return <main className="admin-login-shell"><section className="admin-login-card"><Link href="/" className="admin-login-brand"><span className="admin-brand-mark">T</span><span>Translingual<small>ADMIN ACCESS</small></span></Link><p className="eyebrow">Platform operations</p><h1>Administrator sign in</h1><p>Use an administrator account to manage the learning platform.</p><form onSubmit={submit}><label>Email address<input name="email" type="email" autoComplete="username" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button" disabled={busy}>{busy ? 'Checking access…' : 'Sign in to admin'} <span aria-hidden="true">→</span></button></form><p className="hint"><Link className="text-link" href="/reset-password">Forgot password?</Link> · <Link className="text-link" href="/">Return to public site</Link></p></section></main>;
}
