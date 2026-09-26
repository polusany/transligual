'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';

type Lesson = { id: string; title: string; description: string | null; lessonType: string; sortOrder: number; isPreview: boolean; durationMinutes: number | null; materials: { id: string; materialType: string; downloadable: boolean; streamingOnly: boolean; file: { id: string; originalName: string; mimeType: string | null; status: string } }[] };
type Module = { id: string; title: string; description: string | null; lessons: Lesson[] };
type LearningData = { enrollmentId: string; course: { id: string; slug: string; title: string; description: string; modules: Module[] }; progress: { lessonId: string; progressPercentage: string; completedAt: string | null }[] };

export default function LearningRoomPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<LearningData | null>(null);
  const [selected, setSelected] = useState<Lesson | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    apiRequest<{ id: string }>('/courses/' + encodeURIComponent(slug)).then((course) => apiRequest<LearningData>(`/courses/${course.id}/learn`)).then((result) => { setData(result); setSelected(result.course.modules.flatMap((module) => module.lessons)[0] ?? null); }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Your course could not be opened.'));
  }, [slug]);

  async function markComplete(lesson: Lesson) {
    setBusy(true); setError(''); setNotice('');
    try {
      await apiRequest(`/lessons/${lesson.id}/complete`, { method: 'POST' });
      const refreshed = await apiRequest<LearningData>(`/courses/${data?.course.id}/learn`);
      setData(refreshed); setNotice('Lesson completed. Your course progress has been updated.');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Progress could not be saved.'); }
    finally { setBusy(false); }
  }

  const flatLessons = data?.course.modules.flatMap((module) => module.lessons) ?? [];
  const progress = new Map(data?.progress.map((item) => [item.lessonId, Number(item.progressPercentage)]) ?? []);
  return <main className="page-shell learning-page">
    <p className="eyebrow"><Link href="/dashboard">Your learning space</Link> / Course room</p>
    {error && <section className="empty-state"><h1>We couldn’t open this course.</h1><p>{error}</p><Link className="button" href="/login">Sign in <span aria-hidden="true">→</span></Link></section>}
    {!data && !error && <section className="empty-state"><h1>Opening your course…</h1><p>Checking your enrollment and loading your lessons.</p></section>}
    {data && <><header className="learning-header"><div><p className="eyebrow">Learning room</p><h1>{data.course.title}</h1><p>{data.course.description}</p></div><Link className="button-outline" href="/dashboard">Back to dashboard</Link></header><div className="learning-layout"><aside className="learning-outline"><p className="eyebrow">Your course outline</p>{data.course.modules.map((module) => <section key={module.id} className="outline-module"><h2>{module.title}</h2>{module.lessons.map((lesson) => <button className={`outline-lesson${selected?.id === lesson.id ? ' active' : ''}`} key={lesson.id} onClick={() => { setSelected(lesson); setNotice(''); }}><span>{progress.get(lesson.id) === 100 ? '✓' : '○'}</span>{lesson.title}</button>)}</section>)}</aside><article className="lesson-view">{selected ? <><div className="lesson-view-top"><span className="pill">{selected.lessonType.replaceAll('_', ' ')}</span>{selected.durationMinutes && <span>{selected.durationMinutes} min</span>}</div><h2>{selected.title}</h2>{selected.description ? <p className="lesson-description">{selected.description}</p> : <p className="lesson-description">This lesson is part of your course curriculum. Your instructor will provide the lesson content here.</p>}{selected.materials.length > 0 && <section className="lesson-materials"><h3>Course materials</h3><div className="lesson-material-list">{selected.materials.map((material) => { const contentUrl = `/api/v1/files/${material.file.id}/content`; return <div className="lesson-material-item" key={material.id}>{material.materialType === 'VIDEO' ? <video controls preload="metadata" src={contentUrl}>{material.file.originalName}</video> : material.materialType === 'AUDIO' ? <audio controls preload="metadata" src={contentUrl}>{material.file.originalName}</audio> : <a className="material-meta" href={contentUrl} target="_blank" rel="noreferrer" download={material.downloadable ? material.file.originalName : undefined}>{material.file.originalName} · {material.materialType.toLowerCase()} <span aria-hidden="true">↗</span></a>}</div>; })}</div></section>}<div className="lesson-completion"><div><strong>{progress.get(selected.id) === 100 ? 'Lesson completed' : 'Finished this lesson?'}</strong><p>{progress.get(selected.id) === 100 ? 'Your progress is saved.' : 'Mark it complete to update your course progress.'}</p></div><button className="button" disabled={busy || progress.get(selected.id) === 100} onClick={() => markComplete(selected)}>{progress.get(selected.id) === 100 ? 'Completed' : busy ? 'Saving…' : 'Mark complete'}</button></div>{notice && <p className="form-success" role="status">{notice}</p>}<div className="lesson-next">{flatLessons.findIndex((item) => item.id === selected.id) < flatLessons.length - 1 && <button className="text-button" onClick={() => setSelected(flatLessons[flatLessons.findIndex((item) => item.id === selected.id) + 1])}>Next lesson →</button>}</div></> : <div className="empty-state"><h2>No lessons have been added yet.</h2><p>Your instructor is still preparing this course.</p></div>}</article></div></>}
  </main>;
}
