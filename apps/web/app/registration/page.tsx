'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { apiRequest, CurrentUser } from '../lib/api';

type Registration = { fullName: string; phone: string; program: string; frenchLevel: string; goals: string };
const programs = [ ['beginner', '3-month Beginner French'], ['intermediate', '3-month Intermediate French'], ['advanced', '3-month Advanced French'], ['specialized-tutoring', 'Specialized Tutoring'], ['research-assistance', 'Research Assistance'] ];

export default function RegistrationPage() {
  const router = useRouter();
  const [passport, setPassport] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  useEffect(() => { if (!passport) { setPhotoPreview(''); return; } const url = URL.createObjectURL(passport); setPhotoPreview(url); return () => URL.revokeObjectURL(url); }, [passport]);
  const [hasPassport, setHasPassport] = useState(false);
  const [registeredProgram, setRegisteredProgram] = useState('');
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [form, setForm] = useState<Registration>({ fullName: '', phone: '', program: '', frenchLevel: '', goals: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [next, setNext] = useState('/courses');
  const [returnTo, setReturnTo] = useState('/registration');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReturnTo('/registration' + window.location.search);
    const selectedProgram = programs.find(([value]) => value === params.get('program'))?.[0] || '';
    setForm(previous => ({ ...previous, program: selectedProgram }));
    const course = params.get('course');
    if (course) setNext(`/courses/${encodeURIComponent(course)}${params.get('learn') === '1' ? '/learn' : ''}`);
    apiRequest<CurrentUser>('/auth/me').then(async account => {
      setUser(account);
      if (!account.roles.includes('STUDENT')) return;
      const existing = await apiRequest<(Registration & { hasPassport?: boolean }) | null>('/learner-registration/me');
      setRegisteredProgram(existing?.program || '');
      setHasPassport(Boolean(existing?.hasPassport));
      const selectedProgram = programs.some(([value]) => value === params.get('program')) ? params.get('program')! : '';
      setForm(existing ? { ...existing, program: selectedProgram || existing.program } : { fullName: [account.profile?.firstName, account.profile?.lastName].filter(Boolean).join(' '), phone: '', program: programs.some(([value]) => value === params.get('program')) ? params.get('program')! : '', frenchLevel: '', goals: '' });
    }).catch(caught => { if (caught instanceof Error && caught.message !== 'Sign in to continue.') setError(caught.message); }).finally(() => setLoading(false));
  }, []);

  function update(key: keyof Registration, value: string) { setForm(previous => ({ ...previous, [key]: value })); setSaved(false); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (passport) { const upload = new FormData(); upload.append('file', passport); await apiRequest('/learner-registration/passport', { method: 'POST', body: upload }); setHasPassport(true); setPassport(null); }
      await apiRequest('/learner-registration/me', { method: 'POST', body: JSON.stringify(form) }); setSaved(true); router.push(['beginner', 'intermediate', 'advanced'].includes(form.program) ? '/programs/' + form.program : ['specialized-tutoring', 'research-assistance'].includes(form.program) ? '/' + form.program : next); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Registration could not be submitted. Please try again.'); }
    finally { setBusy(false); }
  }

  return <main className="page-shell"><div className="form-page"><aside className="form-aside"><p className="eyebrow">Learner registration</p><h1>Tell us about your learning journey.</h1><p>Complete this form before starting your first course. Your details are saved to your account, so you can return and update them.</p><p className="form-aside-note">Register for one program at a time. Complete your current program and its assessments before choosing another. Registration does not collect payment.</p></aside><section className="form-card"><h2>Course registration form</h2>{loading ? <p role="status">Loading your details…</p> : user && !user.roles.includes('STUDENT') ? <p>This form is for learner accounts. Sign in with a learner account to register for a course.</p> : saved ? <div role="status"><h3>Your registration has been submitted.</h3><p>You can now join a course or continue your lessons.</p><Link className="button" href={next}>Continue to course →</Link><button className="text-button" type="button" onClick={() => setSaved(false)}>Edit my details</button></div> : <>{!user && <div className="registration-auth"><h3>Your learning journey starts here.</h3><p>Sign in or create a learner account to fill out and save this form. We will bring you back to your selected program.</p><div className="registration-auth-actions"><Link className="button" href={`/login?next=${encodeURIComponent(returnTo)}`}>Sign in to register →</Link><Link className="text-link" href={`/login?mode=register&next=${encodeURIComponent(returnTo)}`}>Create an account</Link></div></div>}{user && registeredProgram && <div className="registration-auth"><p>You are registered for <strong>{programs.find(([id]) => id === registeredProgram)?.[1] || registeredProgram}</strong>. Complete this program before choosing another.</p><Link className="text-link" href={['beginner', 'intermediate', 'advanced'].includes(registeredProgram) ? `/programs/${registeredProgram}` : `/${registeredProgram}`}>Open my registered program →</Link></div>}<form onSubmit={submit}><fieldset className="registration-fields" disabled={!user || busy}>
    <label>Full name<input autoComplete="name" value={form.fullName} onChange={e => update('fullName', e.target.value)} minLength={2} maxLength={120} required /></label>
    <label>Email address<input type="email" value={user?.email || ''} readOnly /><small>This is the email linked to your learner account.</small></label>
    <label>Passport photograph (optional)<input type="file" accept="image/jpeg,image/png"  onChange={event => { const photo = event.target.files?.[0] || null; if (photo && (!['image/jpeg', 'image/png'].includes(photo.type) || photo.size > 5 * 1024 * 1024)) { event.target.value = ''; setPassport(null); setError('Choose a JPEG or PNG passport photo up to 5 MB.'); return; } setPassport(photo); setError(''); }} /><small>{hasPassport ? 'Your photo is saved. Select a file to replace it.' : 'Upload a clear passport-style photograph. JPEG or PNG, up to 5 MB.'}</small>{passport && <small>Selected: {passport.name}</small>}{photoPreview && <img className="passport-preview" src={photoPreview} alt="Preview of your selected passport photograph" />}</label>
    <label>Phone number<input type="tel" autoComplete="tel" value={form.phone} onChange={e => update('phone', e.target.value)} minLength={7} maxLength={30} required /></label>
    <label>Choose your course or service<select value={form.program} onChange={e => update('program', e.target.value)} required><option value="">Select a program</option>{programs.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label>Current French level<select value={form.frenchLevel} onChange={e => update('frenchLevel', e.target.value)} required><option value="">Select your level</option><option value="none">No previous French study</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
    <label>Learning goals<textarea value={form.goals} onChange={e => update('goals', e.target.value)} minLength={10} maxLength={2000} rows={4} placeholder="What would you like to achieve, and what support would help you?" required /></label>
    <button className="button" type="submit" disabled={!user || busy}>{busy ? 'Submitting…' : user ? 'Register and open my course →' : 'Sign in above to register'}</button>
  </fieldset></form></>}{error && <p className="form-error" role="alert">{error}</p>}</section></div></main>;
}
