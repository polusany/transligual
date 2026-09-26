'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../lib/api';

type Category = { id: string; name: string };
type CreatedCourse = { id: string; title: string };

export default function NewCoursePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => { apiRequest<Category[]>('/courses/meta/categories').then(setCategories).catch(() => setError('Course categories are unavailable right now.')); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    const price = Number(form.get('price') ?? 0);
    if (!Number.isFinite(price) || price < 0) { setError('Enter a valid course price.'); return; }
    setLoading(true);
    try {
      const course = await apiRequest<CreatedCourse>('/courses', { method: 'POST', body: JSON.stringify({ title: form.get('title'), shortDescription: form.get('shortDescription'), description: form.get('description'), categoryId: form.get('categoryId'), level: form.get('level'), priceMinor: String(Math.round(price * 100)), currency: form.get('currency'), certificateEnabled: form.get('certificateEnabled') === 'on' }) });
      router.push(`/instructor/courses/${course.id}/curriculum`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'We couldn’t save this course. Please try again.'); }
    finally { setLoading(false); }
  }

  return <main className="page-shell"><div className="form-page"><aside className="form-aside"><p className="eyebrow">Tutor studio</p><h1>Build a course learners will remember.</h1><p>Set a clear promise, define your level, and describe what students will be able to do by the end of your course.</p><p className="form-aside-note">Create a draft, add its sections and lessons, then submit it for administrator review.</p><p><Link className="text-link" href="/teach/apply">Apply to teach with us →</Link></p></aside><section className="form-card"><p className="eyebrow">Course details</p><h2>Create a course draft</h2><p>After saving these details, you’ll build the curriculum before submitting for review.</p><form onSubmit={submit}><label>Course title<input name="title" minLength={3} maxLength={140} placeholder="French for everyday conversation" required /></label><label>Short description<input name="shortDescription" minLength={10} maxLength={160} placeholder="A practical course for confident daily conversations." required /></label><label>Course description<textarea name="description" minLength={30} maxLength={12000} rows={5} placeholder="Describe the learning outcomes, content, and who this course is for." required /></label><div className="form-row"><label>Category<select name="categoryId" required defaultValue=""><option value="" disabled>Select a category</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label>Level<select name="level" required defaultValue="BEGINNER"><option value="BEGINNER">Beginner</option><option value="ELEMENTARY">Elementary</option><option value="INTERMEDIATE">Intermediate</option><option value="UPPER_INTERMEDIATE">Upper intermediate</option><option value="ADVANCED">Advanced</option><option value="PROFICIENT">Proficient</option></select></label></div><div className="form-row"><label>Price<input name="price" type="number" min="0" step="1" defaultValue="0" required /><small>Enter the price in naira. Zero makes the course free.</small></label><label>Currency<select name="currency" defaultValue="NGN"><option value="NGN">NGN · Nigerian naira</option></select></label></div><label className="checkbox-label"><input type="checkbox" name="certificateEnabled" /> Offer a course certificate after completion</label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button" disabled={loading || !categories.length}>{loading ? 'Saving draft…' : 'Save draft and build curriculum'} <span aria-hidden="true">→</span></button></form></section></div></main>;
}
