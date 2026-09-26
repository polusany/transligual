'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '../../../../lib/api';

type Lesson = { id: string; title: string; description: string | null; lessonType: string; isPreview: boolean; durationMinutes: number | null };
type Material = { id: string; materialType: string; downloadable: boolean; file: { id: string; originalName: string; mimeType: string; sizeBytes: string; status: string } };
type CurriculumLesson = Lesson & { materials: Material[] };
type Module = { id: string; title: string; description: string | null; lessons: CurriculumLesson[] };
type Course = { id: string; slug: string; title: string; status: string; modules: Module[] };

export default function AdminCurriculumPage() {
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

  async function uploadMaterial(lessonId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    const formElement = event.currentTarget; const form = new FormData(formElement);
    try {
      await apiRequest(`/lessons/${lessonId}/materials`, { method: 'POST', body: form });
      formElement.reset(); await reload(); setNotice('Course material uploaded and attached to this lesson.');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Course material could not be uploaded.'); }
    finally { setBusy(false); }
  }

  async function submitForReview() {
    setBusy(true); setError(''); setNotice('');
    try { await apiRequest(`/courses/${courseId}/submit`, { method: 'POST' }); setNotice('Course submitted. Review it from the course review queue before publishing.'); await reload(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Course could not be submitted.'); } finally { setBusy(false); }
  }

  const lessonCount = course?.modules.reduce((total, module) => total + module.lessons.length, 0) ?? 0;
  return <main className="page-shell dashboard-page admin-course-editor"><p className="eyebrow"><Link href="/admin/courses">Course manager</Link> / Curriculum</p>
    <section className="dashboard-welcome"><div><p className="eyebrow">Admin course studio</p><h1>{course?.title ?? 'Build the course curriculum'}</h1><p>Add sections and lessons in teaching order. At least one lesson is required before submission.</p></div>{course && <span className="pill">{course.status.replaceAll('_', ' ')}</span>}</section>
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
    {course && course.status === 'DRAFT' && <section className="form-card curriculum-add"><h2>Add a section</h2><form onSubmit={addModule}><label>Section title<input name="title" minLength={2} maxLength={140} placeholder="Greetings and introductions" required /></label><label>Optional description<textarea name="description" rows={2} maxLength={2000} placeholder="What learners will cover in this section" /></label><button className="button" disabled={busy}>Add section <span aria-hidden="true">+</span></button></form></section>}
    {course?.modules.map((module, index) => <section className="curriculum-module" key={module.id}><div className="section-heading"><div><p className="eyebrow">Section {index + 1}</p><h2>{module.title}</h2>{module.description && <p>{module.description}</p>}</div></div>{module.lessons.length ? <ol className="curriculum-lessons">{module.lessons.map((lesson) => <li key={lesson.id}><div><strong>{lesson.title}</strong><p>{lesson.lessonType.replaceAll('_', ' ')}{lesson.durationMinutes ? ` · ${lesson.durationMinutes} min` : ''}{lesson.isPreview ? ' · Preview' : ''}</p>{lesson.description && <p>{lesson.description}</p>}{lesson.materials.length > 0 && <ul className="course-material-list">{lesson.materials.map((material) => <li key={material.id}><a href={`/api/v1/files/${material.file.id}/content`} target="_blank" rel="noreferrer">{material.file.originalName}</a><small>{material.materialType.toLowerCase()} · {(Number(material.file.sizeBytes) / (1024 * 1024)).toFixed(1)} MB</small></li>)}</ul>}{course.status === 'DRAFT' && <form className="lesson-upload-form" onSubmit={(event) => uploadMaterial(lesson.id, event)}><label>Upload lesson video, audio, PDF, or image<input name="file" type="file" accept="video/mp4,video/webm,audio/mpeg,audio/wav,audio/ogg,application/pdf,image/png,image/jpeg" required /></label><small>Up to 50 MB. Accepted: MP4/WebM, MP3/WAV/OGG, PDF, PNG, JPEG.</small><button className="button-outline" disabled={busy}>{busy ? 'Uploading…' : 'Upload material'}</button></form>}</div></li>)}</ol> : <p className="hint">No lessons yet in this section.</p>}{course.status === 'DRAFT' && <form className="lesson-form" onSubmit={(event) => addLesson(module.id, event)}><h3>Add a lesson</h3><label>Lesson title<input name="title" minLength={2} maxLength={140} required /></label><label>Description<textarea name="description" rows={2} maxLength={5000} /></label><div className="form-row"><label>Format<select name="lessonType" defaultValue="TEXT"><option value="TEXT">Text</option><option value="VIDEO">Video</option><option value="AUDIO">Audio</option><option value="DOCUMENT">Document</option><option value="QUIZ">Quiz</option><option value="ASSIGNMENT">Assignment</option><option value="LIVE_CLASS">Live class</option></select></label><label>Estimated minutes<input name="durationMinutes" type="number" min="1" max="600" /></label></div><label className="checkbox-label"><input type="checkbox" name="isPreview" /> Make this lesson available as a free preview</label><button className="button-outline" disabled={busy}>Add lesson</button></form>}</section>)}
    {course?.status === 'DRAFT' && <section className="cta-band"><div><h2>Ready for review?</h2><p>{lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'} added. Submit once the outline is ready.</p></div><button className="button" onClick={submitForReview} disabled={busy || lessonCount === 0}>Submit for review <span aria-hidden="true">→</span></button></section>}
    {course && ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'].includes(course.status) && <section className="cta-band"><div><h2>Course status</h2><p>This course is {course.status.toLowerCase().replaceAll('_', ' ')}. Manage publication from the course review queue.</p></div><button className="button-outline" onClick={() => router.push('/admin#course-reviews')}>Open review queue</button>{course.status === 'PUBLISHED' && <button className="button" onClick={() => router.push(`/courses/${course.slug}`)}>View public course</button>}</section>}
  </main>;
}
