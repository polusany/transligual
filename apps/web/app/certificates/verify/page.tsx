'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';

type Verification = { valid: boolean; certificateNumber?: string; courseTitle?: string; issuedAt?: string; status?: string };
export default function VerifyCertificatePage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<Verification | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { const initial = new URLSearchParams(window.location.search).get('code'); if (initial) { setCode(initial); void verify(initial); } }, []);
  async function verify(value = code) { setBusy(true); setError(''); setResult(null); try { setResult(await apiRequest<Verification>(`/certificates/verify/${encodeURIComponent(value.trim())}`)); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Certificate could not be checked.'); } finally { setBusy(false); } }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void verify(); }
  return <main className="page-shell dashboard-page"><section className="form-page"><aside className="form-aside"><p className="eyebrow">Public verification</p><h1>Check a Transligual certificate.</h1><p>Enter the verification code printed on a certificate to confirm whether it is currently valid.</p><Link className="text-link" href="/certificates">View your certificates →</Link></aside><section className="form-card"><p className="eyebrow">Certificate lookup</p><h2>Verify an achievement</h2><form onSubmit={submit}><label>Verification code<input value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" minLength={8} maxLength={80} required placeholder="Enter certificate code" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button" disabled={busy}>{busy ? 'Checking…' : 'Verify certificate →'}</button></form>{result && <div className={`verification-result ${result.valid ? 'valid' : 'invalid'}`} role="status"><h3>{result.valid ? 'Certificate is valid' : 'Certificate is not valid'}</h3>{result.valid && <><p><strong>{result.courseTitle}</strong></p><p>{result.certificateNumber} · issued {result.issuedAt ? new Date(result.issuedAt).toLocaleDateString() : ''}</p></>}</div>}</section></section></main>;
}
