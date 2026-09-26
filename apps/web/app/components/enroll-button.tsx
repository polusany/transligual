'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../lib/api';

type EnrollmentItem = { course: { id: string } };
export default function EnrollButton({ courseId, slug, isFree }: { courseId: string; slug: string; isFree: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    apiRequest<EnrollmentItem[]>('/enrollments/me').then((items) => setHasAccess(items.some((item) => item.course.id === courseId))).catch(() => undefined);
  }, [courseId]);

  async function enroll() {
    setBusy(true); setMessage('');
    try {
      await apiRequest('/auth/me');
      if (isFree) {
        await apiRequest(`/courses/${courseId}/enroll`, { method: 'POST' });
        setMessage('You’re enrolled. Your course is ready in your learning space.');
        window.setTimeout(() => router.push('/dashboard'), 900);
      } else {
        const checkout = await apiRequest<{ authorizationUrl: string }>(`/courses/${courseId}/checkout`, { method: 'POST' });
        window.location.assign(checkout.authorizationUrl);
      }
    } catch (error) {
      if (error instanceof Error && /sign in|session|unauthorized/i.test(error.message)) { router.push('/login?mode=register'); return; }
      setMessage(error instanceof Error ? error.message : 'We couldn’t complete your enrollment. Please try again.');
    } finally { setBusy(false); }
  }

  return <div className="enroll-action">{hasAccess ? <button className="button" type="button" onClick={() => router.push(`/courses/${slug}/learn`)}>Continue learning <span aria-hidden="true">→</span></button> : <button className="button" type="button" disabled={busy} onClick={enroll}>{busy ? 'Adding course…' : isFree ? 'Join this course' : 'Continue to checkout'} <span aria-hidden="true">→</span></button>}{message && <p className="enroll-message" role="status">{message}</p>}</div>;
}
