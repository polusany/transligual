'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';

type Course = { id: string; slug: string; title: string; shortDescription: string; level: string; priceMinor: string; currency: string; status: string; _count: { modules: number } };

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<Course[]>('/courses/mine')
      .then(setCourses)
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Courses could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  return <main className="page-shell dashboard-page">
    <section className="dashboard-welcome"><div><p className="eyebrow">Tutor studio</p><h1>Your courses</h1><p>Shape each draft, check its status, and send finished curricula to the review desk.</p></div><Link className="button" href="/instructor/courses/new">Create a course <span aria-hidden="true">→</span></Link></section>
    {error && <section className="empty-state"><h2>We couldn’t open the studio.</h2><p>{error}</p><Link className="button-outline" href="/login">Sign in</Link></section>}
    {loading && <section className="empty-state"><h2>Loading your courses…</h2></section>}
    {!loading && !error && (courses.length ? <div className="request-list">{courses.map((course) => <article className="service-dashboard-card" key={course.id}><div><span className="pill">{course.status.replaceAll('_', ' ')}</span><h3>{course.title}</h3><p>{course.shortDescription}</p><small>{course._count.modules} {course._count.modules === 1 ? 'section' : 'sections'} · {course.level.replaceAll('_', ' ')}</small></div><Link className="text-link" href={`/instructor/courses/${course.id}/curriculum`}>Edit curriculum →</Link></article>)}</div> : !error && <section className="empty-state"><h2>Your first course starts here.</h2><p>Create a draft, then add sections and lessons before sending it to review.</p><Link className="button" href="/instructor/courses/new">Create a course <span aria-hidden="true">→</span></Link></section>)}
  </main>;
}
