'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, CurrentUser } from '../lib/api';
export default function LearningHome() {
  const router = useRouter();
  const [error, setError] = useState('');
  useEffect(() => {
    apiRequest<CurrentUser>('/auth/me').then(async user => {
      if (user.roles.some(role => ['ADMIN', 'SUPER_ADMIN'].includes(role))) { router.replace('/admin'); return; }
      if (!user.roles.includes('STUDENT')) { router.replace(user.roles.includes('TUTOR') ? '/instructor/courses' : user.roles.includes('INTERPRETER') ? '/interpreter' : '/registration'); return; }
      const registration = await apiRequest<{ program: string } | null>('/learner-registration/me');
      const program = registration?.program;
      router.replace(program && ['beginner', 'intermediate', 'advanced'].includes(program) ? '/programs/' + program : program && ['specialized-tutoring', 'research-assistance'].includes(program) ? '/' + program : '/registration');
    }).catch(caught => setError(caught instanceof Error ? caught.message : 'Unable to open your course.'));
  }, [router]);
  return <main className="page-shell"><p role={error ? 'alert' : 'status'}>{error || 'Opening your course…'}</p>{error && <><Link className="button" href="/login">Sign in</Link><Link className="button-outline" href="/registration">Registration Form</Link></>}</main>;
}
