'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

type PendingCourse = { id: string; title: string; shortDescription: string; level: string; status: string; submittedAt: string | null; tutor: { email: string; profile?: { firstName: string; lastName: string } | null }; category: { name: string } };
type PendingTutor = { id: string; headline: string; biography: string; qualifications?: string | null; yearsExperience?: number | null; languages: string[]; user: { email: string; profile?: { firstName: string; lastName: string } | null } };
type AdminStats = { users: number; courses: number; pendingTutors: number; payments: number };

export default function AdminPage() {
  const [courses, setCourses] = useState<PendingCourse[]>([]);
  const [tutors, setTutors] = useState<PendingTutor[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [loaded, setLoaded] = useState(false);

  async function refresh() {
    try {
      const [overview, courseList, tutorList] = await Promise.all([
        apiRequest<AdminStats>('/admin/dashboard'),
        apiRequest<PendingCourse[]>('/admin/courses/review'),
        apiRequest<PendingTutor[]>('/admin/tutors/pending'),
      ]);
      setStats(overview); setCourses(courseList); setTutors(tutorList); setError('');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load the admin workspace.'); }
    finally { setLoaded(true); }
  }

  useEffect(() => { void refresh(); }, []);

  async function action(path: string, id: string, label: string) {
    setBusyId(id); setError('');
    try { await apiRequest(path, { method: 'POST' }); await refresh(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : `Unable to ${label.toLowerCase()}.`); }
    finally { setBusyId(''); }
  }

  return <main className="page-shell admin-page">
      <aside className="admin-rail"><Link className="admin-brand" href="/admin"><span className="admin-brand-mark">T</span><span>Translingual<small>ADMIN CONSOLE</small></span></Link><p className="admin-rail-label">WORKSPACE</p><nav aria-label="Admin workspace"><a className="active" href="#overview">Overview</a><Link href="/admin/courses">Course manager</Link><a href="#course-reviews">Course reviews <span>{courses.length}</span></a><a href="#tutor-applications">Tutor applications <span>{tutors.length}</span></a></nav><div className="admin-rail-bottom"><Link href="/dashboard">Learner dashboard ↗</Link><Link href="/">View public site ↗</Link></div></aside>
    <div className="admin-main">
      <header className="admin-topbar"><div><p className="eyebrow">Platform operations</p><h1>Admin dashboard</h1></div><div className="admin-topbar-actions"><Link className="button" href="/admin/courses/new">Create course <span aria-hidden="true">+</span></Link><Link className="button-outline" href="/dashboard">Learner view</Link></div></header>
      {error && <div className="admin-alert" role="alert"><strong>Workspace unavailable</strong><p>{error}</p>{error.startsWith('Sign in') || error.includes('permission') ? <Link className="text-link" href="/admin/login">Sign in with an admin account →</Link> : <button className="text-button" onClick={() => void refresh()}>Try again</button>}</div>}
      {!loaded ? <section className="empty-state"><h2>Preparing your admin workspace…</h2></section> : error && !stats ? <section className="admin-access-card"><span className="admin-access-icon">A</span><p className="eyebrow">Restricted workspace</p><h2>Administrator access required</h2><p>This console is for platform administrators. Learners and tutors can use their personal dashboard instead.</p><div><Link className="button" href="/admin/login">Admin sign in <span aria-hidden="true">→</span></Link><Link className="button-outline" href="/dashboard">Learner dashboard</Link></div></section> : <>
        <section className="admin-welcome" id="overview"><div><p className="admin-kicker">GOOD DAY, ADMINISTRATOR</p><h2>Keep the platform moving.</h2><p>Review people and courses, then help learners get to the right language support.</p></div><span className="admin-orbit" aria-hidden="true">TL</span></section>
        <section className="admin-metrics" aria-label="Platform overview"><article><span>Total accounts</span><strong>{stats?.users ?? '—'}</strong><small>Registered learners and professionals</small></article><article><span>Courses in platform</span><strong>{stats?.courses ?? '—'}</strong><small>Across all course statuses</small></article><article className={tutors.length ? 'needs-attention' : ''}><span>Tutor applications</span><strong>{stats?.pendingTutors ?? 0}</strong><small>Waiting for administrator review</small></article><article><span>Payments recorded</span><strong>{stats?.payments ?? '—'}</strong><small>All payment statuses</small></article></section>
        <section className="admin-queue" id="course-reviews"><div className="admin-section-heading"><div><p className="admin-kicker">ACADEMY QUALITY</p><h2>Course review queue</h2><p>Publish courses after reviewing their teaching outline.</p></div><span className="admin-count">{courses.length} waiting</span></div>
          {courses.length ? <div className="admin-review-list">{courses.map((course) => <article className="admin-review-card" key={course.id}><div className="admin-review-top"><span className="admin-status">{course.status.replaceAll('_', ' ')}</span><span>{course.category.name} · {course.level.replaceAll('_', ' ')}</span></div><h3>{course.title}</h3><p>{course.shortDescription}</p><small>{course.submittedAt ? `Submitted ${new Date(course.submittedAt).toLocaleDateString()}` : 'Awaiting review'} · {course.tutor.profile ? `${course.tutor.profile.firstName} ${course.tutor.profile.lastName}` : course.tutor.email}</small><button className="button" type="button" disabled={busyId === course.id} onClick={() => void action(`/admin/courses/${course.id}/publish`, course.id, 'Publish')}>{busyId === course.id ? 'Publishing…' : 'Approve and publish →'}</button></article>)}</div> : <div className="admin-empty"><span>✓</span><div><h3>All clear</h3><p>Submitted courses will appear here when they are ready for review.</p></div></div>}
        </section>
        <section className="admin-queue" id="tutor-applications"><div className="admin-section-heading"><div><p className="admin-kicker">PROFESSIONAL COMMUNITY</p><h2>Tutor applications</h2><p>Review qualifications and approve tutors for the course studio.</p></div><span className="admin-count">{tutors.length} waiting</span></div>
          {tutors.length ? <div className="admin-review-list">{tutors.map((tutor) => <article className="admin-review-card" key={tutor.id}><div className="admin-review-top"><span className="admin-status">New application</span><span>{tutor.languages.join(' · ')}</span></div><h3>{tutor.headline}</h3><p>{tutor.biography}</p>{tutor.qualifications && <p><strong>Qualifications:</strong> {tutor.qualifications}</p>}<small>{tutor.user.profile ? `${tutor.user.profile.firstName} ${tutor.user.profile.lastName}` : tutor.user.email}{tutor.yearsExperience ? ` · ${tutor.yearsExperience} years experience` : ''}</small><div className="admin-card-actions"><button className="button" type="button" disabled={busyId === tutor.id} onClick={() => void action(`/admin/tutors/${tutor.id}/approve`, tutor.id, 'Approve')}>{busyId === tutor.id ? 'Saving…' : 'Approve tutor'}</button><button className="button-outline" type="button" disabled={busyId === tutor.id} onClick={() => void action(`/admin/tutors/${tutor.id}/reject`, tutor.id, 'Reject')}>Decline application</button></div></article>)}</div> : <div className="admin-empty"><span>✓</span><div><h3>No applications to review</h3><p>New tutor applications will appear here.</p></div></div>}
        </section>
      </>}
    </div>
  </main>;
}
