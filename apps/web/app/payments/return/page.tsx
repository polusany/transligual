'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';

type Verification = { status: string; enrollmentId: string | null; itemType?: string };
export default function PaymentReturnPage() {
  const [result, setResult] = useState<Verification | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const reference = new URLSearchParams(window.location.search).get('reference');
    if (!reference) { setError('No payment reference was provided.'); return; }
    apiRequest<Verification>(`/payments/verify/${encodeURIComponent(reference)}`, { method: 'POST' }).then(setResult).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'We could not verify this payment.'));
  }, []);

  return <main className="page-shell"><div className="form-page"><aside className="form-aside"><p className="eyebrow">Payment status</p><h1>{result?.status === 'SUCCESSFUL' ? 'Your payment is confirmed.' : 'Confirming your payment.'}</h1><p>We verify your payment directly with the provider before activating your course or confirming your booking.</p></aside><section className="form-card"><p className="eyebrow">Course enrollment</p>{error ? <><h2>We couldn’t confirm this payment.</h2><p className="form-error" role="alert">{error}</p><p>Do not pay again until you have checked your payment status or contacted support.</p><Link className="button-outline" href="/dashboard">Go to your learning space</Link></> : result?.status === 'SUCCESSFUL' ? <><h2>Payment verified.</h2><p>Your purchase is confirmed. Open your dashboard to continue.</p><Link className="button" href={result.itemType === 'INTERPRETATION' ? '/interpretation/bookings' : '/dashboard'}>Continue <span aria-hidden="true">→</span></Link></> : result ? <><h2>{result.status === 'PROCESSING' ? 'Payment is still processing.' : result.status === 'CANCELLED' ? 'Checkout was not completed.' : 'Payment not completed.'}</h2><p>The provider has not confirmed a successful payment. If your account was debited, check the status before paying again.</p><Link className="button-outline" href="/courses">Return to course library</Link></> : <><h2>Checking your payment…</h2><p>Please keep this page open while we confirm the transaction.</p></>}</section></div></main>;
}
