'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';

export default function TutorApplicationPage() {
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await apiRequest('/tutors/apply', { method: 'POST', body: JSON.stringify({ headline: form.get('headline'), biography: form.get('biography'), qualifications: form.get('qualifications'), yearsExperience: form.get('yearsExperience') ? Number(form.get('yearsExperience')) : undefined, languages: String(form.get('languages') ?? '').split(',').map((item) => item.trim()).filter(Boolean) }) });
      setSent(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'We couldn’t submit your application. Please try again.'); }
    finally { setBusy(false); }
  }

  return <main className="page-shell"><div className="form-page"><aside className="form-aside"><p className="eyebrow">Teach with Transligual</p><h1>Help someone find their voice.</h1><p>Share your experience and tell us what you bring to French language learning. Our team reviews every tutor application before course creation is enabled.</p><p className="form-aside-note">Applications are reviewed by the Transligual team. Submission does not guarantee approval.</p></aside><section className="form-card"><p className="eyebrow">Tutor application</p><h2>{sent ? 'Your application is in review.' : 'Tell us about your teaching'}</h2>{sent ? <><p>Thanks for applying. Your profile is waiting for review. We’ll enable course creation after approval.</p><Link className="button" href="/dashboard">Go to your learning space</Link></> : <><p>Use a few specific details to help us understand your teaching experience.</p><form onSubmit={submit}><label>Professional headline<input name="headline" minLength={8} maxLength={140} placeholder="French tutor for confident conversation" required /></label><label>About your teaching<textarea name="biography" minLength={40} maxLength={5000} rows={5} placeholder="Describe your experience, teaching style, and the learners you support." required /></label><label>Languages you teach<input name="languages" placeholder="French, English" required /><small>Separate languages with commas.</small></label><div className="form-row"><label>Qualifications<input name="qualifications" maxLength={2000} placeholder="Degree, certificate, or relevant experience" /></label><label>Years of experience<input name="yearsExperience" type="number" min="0" max="60" /></label></div>{error && <p className="form-error" role="alert">{error} <Link href="/login">Sign in</Link></p>}<button className="button" disabled={busy}>{busy ? 'Submitting…' : 'Submit application'} <span aria-hidden="true">→</span></button></form></>}</section></div></main>;
}
