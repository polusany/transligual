'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';

type Course = { id: string; slug: string; title: string; shortDescription: string; program: string | null; level: string; priceMinor: string; currency: string; status: string; updatedAt: string; _count: { modules: number } };

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState('');
  async function assignProgram(id: string, program: string) {
    setAssigning(id); setError('');
    try { await apiRequest('/courses/' + id + '/program', { method: 'POST', body: JSON.stringify({ program }) }); setCourses(previous => previous.map(course => course.id === id ? { ...course, program: program || null } : course)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to assign program.'); }
    finally { setAssigning(''); }
  }
  useEffect(() => { apiRequest<Course[]>('/courses/mine').then(setCourses).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Courses could not be loaded.')).finally(() => setLoading(false)); }, []);

  return <main className="page-shell admin-content-page"><header className="admin-content-heading"><div><p className="eyebrow">Academy</p><h1>Course manager</h1><p>Create course drafts, build curricula, and track publication status.</p></div><Link className="button" href="/admin/courses/new">Create course <span aria-hidden="true">+</span></Link></header>
    <section className="course-program-grid" aria-label="Manage French programs">{["beginner", "intermediate", "advanced"].map(program => <article className="course-program" key={program}><h2>3-month {program[0].toUpperCase() + program.slice(1)} French</h2><p><Link href={`/programs/${program}`}>View program page →</Link></p><Link className="button-outline" href={`/admin/courses/new?program=${program}`}>Add course and upload lessons →</Link></article>)}</section>
    {error && <div className="admin-alert" role="alert"><strong>Could not load courses</strong><p>{error}</p><Link className="text-link" href="/admin/login">Sign in with an administrator account →</Link></div>}
    {loading ? <section className="empty-state"><h2>Loading courses…</h2></section> : !error && (courses.length ? <div className="admin-course-list">{courses.map((course) => <article className="admin-course-row" key={course.id}><div><span className="pill">{course.status.replaceAll('_', ' ')}</span><h2>{course.title}</h2><p>{course.shortDescription}</p><label>Program page<select aria-label={`Program page for ${course.title}`} value={course.program || ""} disabled={assigning === course.id} onChange={event => void assignProgram(course.id, event.target.value)}><option value="">General course library</option><option value="beginner">3-month Beginner French</option><option value="intermediate">3-month Intermediate French</option><option value="advanced">3-month Advanced French</option></select></label><small>{course.level.replaceAll('_', ' ')} · {course._count.modules} sections · Updated {new Date(course.updatedAt).toLocaleDateString()}</small></div><Link className="button-outline" href={`/admin/courses/${course.id}/curriculum`}>Manage curriculum →</Link></article>)}</div> : !error && <section className="empty-state"><h2>No courses yet</h2><p>Create your first course, add its sections and lessons, then submit it for review.</p><Link className="button" href="/admin/courses/new">Create a course →</Link></section>)}
  </main>;
}
