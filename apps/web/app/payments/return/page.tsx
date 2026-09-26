'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';

type Verification = { status: string; enrollmentId: string | null };
export default function PaymentReturnPage() {
  const [result, setResult] = useState<Verification | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const reference = new URLSearchParams(window.location.search).get('reference');
    if (!reference) { setError('No payment reference was provided.'); return; }
    apiRequest<Verification>(`/payments/verify/${encodeURIComponent(reference)}`, { method: 'POST' }).then(setResult).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'We could not verify this payment.'));
  }, []);

  return <main className="page-shell"><div className="form-page"><aside className="form-aside"><p className="eyebrow">Payment status</p><h1>{result?.status === 'SUCCESSFUL' ? 'Your next lesson is ready.' : 'Confirming your payment.'}</h1><p>We verify your payment directly with the provider before activating course access.</p></aside><section className="form-card"><p className="eyebrow">Course enrollment</p>{error ? <><h2>We couldn’t confirm this payment.</h2><p className="form-error" role="alert">{error}</p><p>Do not pay again until you have checked your payment status or contacted support.</p><Link className="button-outline" href="/dashboard">Go to your learning space</Link></> : result?.status === 'SUCCESSFUL' ? <><h2>Payment verified.</h2><p>Your enrollment is active. You can start learning now.</p><Link className="button" href="/dashboard">Open my courses <span aria-hidden="true">→</span></Link></> : result ? <><h2>Payment not completed.</h2><p>The provider did not confirm a successful payment, so course access was not activated.</p><Link className="button-outline" href="/courses">Return to course library</Link></> : <><h2>Checking your payment…</h2><p>Please keep this page open while we confirm the transaction.</p></>}</section></div></main>;
}
