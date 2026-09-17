'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../lib/api';

type AuthResult = {
  accessToken: string;
  user: {
    id: string;
    email: string;
  };
};

export default function Login() {
  const router = useRouter();

  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registering = mode === 'register';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
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

        const result = await apiRequest<AuthResult>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        sessionStorage.setItem(
          'transligual.accessToken',
          result.accessToken
        );

        router.push('/dashboard');
      } else {
        const payload = {
          email,
          password,
        };

        const result = await apiRequest<AuthResult>('/auth/login', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        sessionStorage.setItem(
          'transligual.accessToken',
          result.accessToken
        );

        router.push('/dashboard');
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
    <section>
      <p className="eyebrow">ACCOUNT</p>

      <h1>
        {registering ? 'Welcome to Transligual' : 'Welcome back'}
      </h1>

      <p>
        {registering
          ? 'Create your learner account to get started.'
          : 'Sign in to continue learning.'}
      </p>

      <form onSubmit={submit} method="post">
        {registering && (
          <div className="name-fields">
            <label>
              First name
              <input
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
              />
            </label>

            <label>
              Last name
              <input
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
              />
            </label>
          </div>
        )}

        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={
              registering ? 'new-password' : 'current-password'
            }
            minLength={registering ? 12 : 1}
            required
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Please wait…' : 'Continue'}
        </button>
      </form>

      <p className="hint">
        {registering
          ? 'Already have an account?'
          : 'New to Transligual?'}

        {' '}

        <button
          className="text-button"
          type="button"
          onClick={() => {
            setMode(registering ? 'login' : 'register');
            setError('');
          }}
        >
          {registering ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </section>
  );
}

