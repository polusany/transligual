import type { Metadata } from 'next';
import CourseCatalog from './catalog';
import { CourseSummary } from '../components/course-card';
import { serverApiUrl } from '../lib/server-api';

export const metadata: Metadata = { title: 'French course library' };

async function getCourses(): Promise<{ courses: CourseSummary[]; error?: string }> {
  try {
    const response = await fetch(serverApiUrl('/courses'), { cache: 'no-store' });
    if (!response.ok) return { courses: [], error: 'The course service returned an error. Please try again shortly.' };
    const payload = await response.json();
    const data = (payload?.data ?? payload) as CourseSummary[];
    return { courses: data.filter((course) => course.status === 'PUBLISHED') };
  } catch {
    return { courses: [], error: 'The course service is temporarily unavailable. Please try again shortly.' };
  }
}

export default async function CoursesPage() {
  const result = await getCourses();
  return (
    <main className="page-shell">
      <header className="page-intro"><p className="eyebrow">The course library</p><h1>Find your way into French.</h1><p>Learn with a clear structure, practical lessons, and tutors who help you make every new word your own.</p></header>
      <CourseCatalog courses={result.courses} error={result.error} />
      <section className="cta-band"><div><h2>Not sure where to begin?</h2><p>Start with the level that feels right. You can build from there.</p></div><a className="button-outline" href="/about">Explore our approach <span aria-hidden="true">→</span></a></section>
    </main>
  );
}
