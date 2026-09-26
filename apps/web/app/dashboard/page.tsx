'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest, CurrentUser } from '../lib/api';

type Enrollment = { id: string; status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'; course: { id: string; slug: string; title: string; shortDescription: string; level: string }; courseProgress?: { progressPercentage: string | number } | null };
type InterpretationBooking = { id: string; sourceLanguage: string; targetLanguage: string; scheduledStartAt: string; status: string; service: { name: string } };

export default function Dashboard() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [courses, setCourses] = useState<Enrollment[]>([]);
  const [bookings, setBookings] = useState<InterpretationBooking[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<CurrentUser>('/auth/me')
      .then(async (account) => {
        setUser(account);
        if (account.roles.some((role) => ['ADMIN', 'SUPER_ADMIN'].includes(role))) { setIsAdmin(true); return; }
        const [enrollments, interpretationBookings] = await Promise.all([
          apiRequest<Enrollment[]>('/enrollments/me'),
          apiRequest<InterpretationBooking[]>('/interpretation/bookings/me'),
        ]);
        setCourses(enrollments); setBookings(interpretationBookings);
      })
      .catch((caught: unknown) => { setError(caught instanceof Error ? caught.message : 'Unable to load your learning space.'); })
      .finally(() => setLoading(false));
  }, []);

  async function logout() { await apiRequest('/auth/logout', { method: 'POST' }).catch(() => undefined); window.location.href = '/login'; }
  const name = user?.profile?.displayName || user?.profile?.firstName || 'Learner';
  const activeCount = courses.filter((course) => course.status === 'ACTIVE').length;
  const completeCount = courses.filter((course) => course.status === 'COMPLETED').length;

  if (error) return <main className="page-shell"><div className="form-page"><section className="form-card"><p className="eyebrow">Your learning space</p><h1>Sign in to continue.</h1><p>{error}</p><Link href="/login" className="button">Sign in <span aria-hidden="true">→</span></Link></section></div></main>;
  if (loading) return <main className="page-shell dashboard-page"><section className="empty-state"><p className="eyebrow">Your learning space</p><h2>Getting everything ready…</h2><p>Loading your account and courses.</p></section></main>;
  if (isAdmin) return <main className="page-shell dashboard-page"><section className="role-switch-card"><span className="role-switch-mark">A</span><div><p className="eyebrow">Administrator account</p><h1>This is the learner dashboard.</h1><p>Your administrator tools have a separate workspace with platform metrics, course reviews, and tutor applications.</p><Link className="button" href="/admin">Open admin dashboard <span aria-hidden="true">→</span></Link></div></section></main>;

  return (
    <main className="page-shell dashboard-page">
      <section className="dashboard-welcome"><div><p className="eyebrow">Learner dashboard</p><h1>Bonjour, {name}.</h1><p>Small steps make a lasting difference. Pick up where you left off, or find a new course to explore.</p></div><Link className="button-outline" href="/courses">Explore courses <span aria-hidden="true">↗</span></Link></section>
      <section className="dashboard-stats" aria-label="Learning summary"><div className="dashboard-stat"><strong>{courses.length}</strong><span>Courses joined</span></div><div className="dashboard-stat"><strong>{activeCount}</strong><span>In progress</span></div><div className="dashboard-stat"><strong>{completeCount}</strong><span>Completed</span></div></section>
      <section className="dashboard-section"><div className="section-heading"><div><p className="eyebrow">Keep learning</p><h2>Your courses</h2></div><Link className="text-link" href="/courses">Browse all courses <span aria-hidden="true">→</span></Link></div>
        {courses.length ? <div className="course-grid">{courses.map((enrollment, index) => <article className="course-card" key={enrollment.id}><div className={`course-cover ${['green','sand','rose'][index%3]}`}><span className="course-cover-word">Continue</span></div><div className="course-card-body"><div className="course-meta"><span className="pill">{enrollment.status === 'COMPLETED' ? 'Completed' : 'In progress'}</span><span>{enrollment.course.level.replaceAll('_',' ')}</span></div><h3>{enrollment.course.title}</h3><p>{enrollment.course.shortDescription}</p><div className="course-card-bottom"><Link className="text-link" href={`/courses/${enrollment.course.slug}/learn`}>Continue learning <span aria-hidden="true">→</span></Link><span className="course-price">{enrollment.courseProgress ? `${Math.round(Number(enrollment.courseProgress.progressPercentage))}%` : ''}</span></div></div></article>)}</div> : <div className="empty-state"><h2>Your first course is waiting.</h2><p>Explore the library to find a French course that fits your goals and schedule.</p><Link className="button" href="/courses">Browse French courses <span aria-hidden="true">→</span></Link></div>}
      </section>
      <section className="dashboard-section"><div className="section-heading"><div><p className="eyebrow">Your achievements</p><h2>Certificates</h2></div><Link className="text-link" href="/certificates">View certificates →</Link></div><p className="hint">Finished a certificate-enabled course? Your certificate and public verification code will be available here.</p></section>
      <section className="dashboard-section"><div className="section-heading"><div><p className="eyebrow">Language services</p><h2>Support for every conversation</h2></div></div><div className="service-grid"><article className="service-dashboard-card"><div><h3>Instant translation</h3><p>Translate a phrase or passage right away.</p></div><Link className="text-link" href="/services/translation">Open translator →</Link></article><article className="service-dashboard-card"><div><h3>Interpretation</h3><p>Plan an interpreted meeting or appointment.</p></div><Link className="text-link" href="/services/interpretation">Request a booking →</Link></article></div></section>
      {bookings.length > 0 && <section className="dashboard-section"><div className="section-heading"><div><p className="eyebrow">Your bookings</p><h2>Interpretation updates</h2></div></div><div className="request-list">{bookings.map((booking) => <article className="service-dashboard-card" key={booking.id}><div><h3>{booking.service.name}</h3><p>{booking.sourceLanguage} → {booking.targetLanguage} · {new Date(booking.scheduledStartAt).toLocaleString()}</p></div><span className="pill">{booking.status.replaceAll('_',' ')}</span></article>)}</div></section>}
      {user?.roles.includes('TUTOR') && <section className="cta-band"><div><h2>Your tutor studio</h2><p>Build a course for learners who are ready to move forward.</p></div><Link className="button" href="/instructor/courses">Open course studio →</Link></section>}
      {user?.roles.some((role) => ['ADMIN','SUPER_ADMIN'].includes(role)) && <section className="cta-band"><div><h2>Administration</h2><p>Review tutor applications and courses before they reach learners.</p></div><Link className="button" href="/admin">Open review desk →</Link></section>}
      {user && !user.roles.includes('TUTOR') && !user.roles.some((role) => ['ADMIN','SUPER_ADMIN'].includes(role)) && <p className="hint" style={{marginTop:30}}>Interested in teaching? <Link className="text-link" href="/teach/apply">Apply to teach with Transligual →</Link></p>}
      <p className="hint" style={{marginTop:40}}><button type="button" className="text-button" onClick={logout}>Sign out</button></p>
    </main>
  );
}
