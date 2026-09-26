'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '../../../../lib/api';

type Lesson = { id: string; title: string; description: string | null; lessonType: string; isPreview: boolean; durationMinutes: number | null };
type Module = { id: string; title: string; description: string | null; lessons: Lesson[] };
type Course = { id: string; slug: string; title: string; status: string; modules: Module[] };

export default function CurriculumPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const reload = () => apiRequest<Course>(`/courses/${courseId}/curriculum`).then(setCourse).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Curriculum could not be loaded.'));

  useEffect(() => { void reload(); }, [courseId]);

  async function addModule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    const formElement = event.currentTarget; const form = new FormData(formElement);
    try { await apiRequest(`/courses/${courseId}/modules`, { method: 'POST', body: JSON.stringify({ title: form.get('title'), description: form.get('description') }) }); formElement.reset(); await reload(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Section could not be saved.'); } finally { setBusy(false); }
  }

  async function addLesson(moduleId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    const formElement = event.currentTarget; const form = new FormData(formElement);
    try { await apiRequest(`/modules/${moduleId}/lessons`, { method: 'POST', body: JSON.stringify({ title: form.get('title'), description: form.get('description'), lessonType: form.get('lessonType'), durationMinutes: Number(form.get('durationMinutes')) || undefined, isPreview: form.get('isPreview') === 'on' }) }); formElement.reset(); await reload(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Lesson could not be saved.'); } finally { setBusy(false); }
  }

  async function submitForReview() {
    setBusy(true); setError(''); setNotice('');
    try { await apiRequest(`/courses/${courseId}/submit`, { method: 'POST' }); setNotice('Course submitted. An administrator will review it before it appears in the public library.'); await reload(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Course could not be submitted.'); } finally { setBusy(false); }
  }

  const lessonCount = course?.modules.reduce((total, module) => total + module.lessons.length, 0) ?? 0;
  return <main className="page-shell dashboard-page">
    <p className="eyebrow"><Link href="/instructor/courses">Tutor studio</Link> / Curriculum</p>
    <section className="dashboard-welcome"><div><p className="eyebrow">Course builder</p><h1>{course?.title ?? 'Build your curriculum'}</h1><p>Add sections and lessons in teaching order. At least one lesson is required for review.</p></div>{course && <span className="pill">{course.status.replaceAll('_', ' ')}</span>}</section>
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
    {course && course.status === 'DRAFT' && <section className="form-card curriculum-add"><h2>Add a section</h2><form onSubmit={addModule}><label>Section title<input name="title" minLength={2} maxLength={140} placeholder="Greetings and introductions" required /></label><label>Optional description<textarea name="description" rows={2} maxLength={2000} placeholder="What learners will cover in this section" /></label><button className="button" disabled={busy}>Add section <span aria-hidden="true">+</span></button></form></section>}
    {course?.modules.map((module, index) => <section className="curriculum-module" key={module.id}><div className="section-heading"><div><p className="eyebrow">Section {index + 1}</p><h2>{module.title}</h2>{module.description && <p>{module.description}</p>}</div></div>{module.lessons.length ? <ol className="curriculum-lessons">{module.lessons.map((lesson) => <li key={lesson.id}><div><strong>{lesson.title}</strong><p>{lesson.lessonType.replaceAll('_', ' ')}{lesson.durationMinutes ? ` · ${lesson.durationMinutes} min` : ''}{lesson.isPreview ? ' · Preview' : ''}</p>{lesson.description && <p>{lesson.description}</p>}</div></li>)}</ol> : <p className="hint">No lessons yet in this section.</p>}{course.status === 'DRAFT' && <form className="lesson-form" onSubmit={(event) => addLesson(module.id, event)}><h3>Add a lesson</h3><label>Lesson title<input name="title" minLength={2} maxLength={140} required /></label><label>Description<textarea name="description" rows={2} maxLength={5000} /></label><div className="form-row"><label>Format<select name="lessonType" defaultValue="TEXT"><option value="TEXT">Text</option><option value="VIDEO">Video</option><option value="AUDIO">Audio</option><option value="DOCUMENT">Document</option><option value="QUIZ">Quiz</option><option value="ASSIGNMENT">Assignment</option><option value="LIVE_CLASS">Live class</option></select></label><label>Estimated minutes<input name="durationMinutes" type="number" min="1" max="600" /></label></div><label className="checkbox-label"><input type="checkbox" name="isPreview" /> Make this lesson available as a free preview</label><button className="button-outline" disabled={busy}>Add lesson</button></form>}</section>)}
    {course && !course.modules.length && <section className="empty-state"><h2>Your outline is ready for its first section.</h2><p>Group related lessons into sections to give learners a clear path.</p></section>}
    {course?.status === 'DRAFT' && <section className="cta-band"><div><h2>Ready for review?</h2><p>{lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'} added. You can submit once your first lesson is in place.</p></div><button className="button" onClick={submitForReview} disabled={busy || lessonCount === 0}>Submit course for review <span aria-hidden="true">→</span></button></section>}
    {course && ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'].includes(course.status) && <section className="cta-band"><div><h2>Course review status</h2><p>This course has been submitted and is now {course.status.toLowerCase().replaceAll('_', ' ')}.</p></div>{course.status === 'PUBLISHED' && <button className="button" onClick={() => router.push(`/courses/${course.slug}`)}>View public course</button>}</section>}
  </main>;
}
