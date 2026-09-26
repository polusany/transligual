'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../lib/api';

type Category = { id: string; name: string };
type CreatedCourse = { id: string };

export default function AdminNewCoursePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { apiRequest<Category[]>('/courses/meta/categories').then(setCategories).catch(() => setError('Course categories are unavailable.')); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget); const price = Number(form.get('price') ?? 0);
    if (!Number.isFinite(price) || price < 0) { setError('Enter a valid course price.'); setBusy(false); return; }
    try {
      const course = await apiRequest<CreatedCourse>('/courses', { method: 'POST', body: JSON.stringify({ title: form.get('title'), shortDescription: form.get('shortDescription'), description: form.get('description'), categoryId: form.get('categoryId'), level: form.get('level'), priceMinor: String(Math.round(price * 100)), currency: 'NGN', certificateEnabled: form.get('certificateEnabled') === 'on' }) });
      router.push(`/admin/courses/${course.id}/curriculum`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Course draft could not be saved.'); }
    finally { setBusy(false); }
  }
  return <main className="page-shell admin-content-page"><p className="eyebrow"><Link href="/admin/courses">Course manager</Link> / New course</p><div className="form-page"><aside className="form-aside"><p className="eyebrow">Admin course studio</p><h1>Build a course for the library.</h1><p>Create the course record, add its curriculum, then send it through the review and publishing workflow.</p><p className="form-aside-note">Add lessons and upload video, audio, PDF, or image materials in the next step. Files up to 50 MB are supported.</p></aside><section className="form-card"><p className="eyebrow">Course details</p><h2>Create a course draft</h2><form onSubmit={submit}><label>Course title<input name="title" minLength={3} maxLength={140} required /></label><label>Short description<input name="shortDescription" minLength={10} maxLength={160} required /></label><label>Course description<textarea name="description" minLength={30} maxLength={12000} rows={5} required /></label><div className="form-row"><label>Category<select name="categoryId" required defaultValue=""><option value="" disabled>Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Level<select name="level" defaultValue="BEGINNER"><option value="BEGINNER">Beginner</option><option value="ELEMENTARY">Elementary</option><option value="INTERMEDIATE">Intermediate</option><option value="UPPER_INTERMEDIATE">Upper intermediate</option><option value="ADVANCED">Advanced</option><option value="PROFICIENT">Proficient</option></select></label></div><div className="form-row"><label>Price in naira<input name="price" type="number" min="0" step="1" defaultValue="0" required /></label><label>Currency<input value="NGN" readOnly /></label></div><label className="checkbox-label"><input type="checkbox" name="certificateEnabled" /> Offer a certificate after completion</label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button" disabled={busy || !categories.length}>{busy ? 'Saving draft…' : 'Save draft and build curriculum →'}</button></form></section></div></main>;
}
