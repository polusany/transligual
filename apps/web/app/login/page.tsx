'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, CurrentUser } from '../lib/api';

export default function Login() {
  const router = useRouter();

  const [mode, setMode] = useState<'register' | 'login'>('login');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registering = mode === 'register';

  useEffect(() => {
    setMode(new URLSearchParams(window.location.search).get('mode') === 'register' ? 'register' : 'login');
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setNotice('');
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);

    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');

    try {
      if (registering) {
        const payload = {
          email,
          password,
          firstName: String(form.get('firstName') ?? '').trim(),
          lastName: String(form.get('lastName') ?? '').trim(),
        };

        const result = await apiRequest<{ message: string }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setNotice(result.message);
        setMode('login');
      } else {
        await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        const user = await apiRequest<CurrentUser>('/auth/me');
        const destination = user.roles.some((role) => ['ADMIN', 'SUPER_ADMIN'].includes(role))
          ? '/admin'
          : user.roles.includes('TUTOR')
            ? '/instructor/courses'
            : '/dashboard';
        router.push(destination);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to continue.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="form-page">
        <aside className="form-aside"><p className="eyebrow">Your learning space</p><h1>{registering ? 'A new language. A new perspective.' : 'Welcome back.'}</h1><p>{registering ? 'Create your account and get ready to build a confident, lasting connection with French.' : 'Sign in to pick up your learning journey and see what’s next.'}</p><p className="form-aside-note">Your account keeps your learning progress, courses, and bookings together.</p></aside>
        <section className="form-card" aria-labelledby="account-title">
          <p className="eyebrow">{registering ? 'Create account' : 'Sign in'}</p>
          <h2 id="account-title">{registering ? 'Get started with Transligual' : 'Sign in to your account'}</h2>
          <p>{registering ? 'A few details are all you need to begin.' : 'Enter the details you used to create your account.'}</p>
          <form onSubmit={submit} method="post">
            {registering && <div className="form-row"><label>First name<input name="firstName" type="text" autoComplete="given-name" placeholder="Your first name" required /></label><label>Last name<input name="lastName" type="text" autoComplete="family-name" placeholder="Your last name" required /></label></div>}
            <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
            <label>Password<input name="password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 12 : 1} placeholder={registering ? 'At least 12 characters' : 'Your password'} required />{registering && <small>Use at least 12 characters.</small>}</label>
            {error && <p className="form-error" role="alert">{error}</p>}
            {notice && <p className="form-success" role="status">{notice}</p>}
            <button className="button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : registering ? 'Create my account' : 'Sign in'} <span aria-hidden="true">→</span></button>
          </form>
          {!registering && <p className="hint"><Link className="text-link" href="/reset-password">Forgot your password?</Link> · <Link className="text-link" href="/verify-email">Resend verification email</Link></p>}
          <p className="hint">{registering ? 'Already have an account?' : 'New to Transligual?'}{' '}<button className="text-button" type="button" onClick={() => { setMode(registering ? 'login' : 'register'); setError(''); setNotice(''); }}>{registering ? 'Sign in' : 'Create an account'}</button></p>
        </section>
      </div>
    </main>
  );
}
