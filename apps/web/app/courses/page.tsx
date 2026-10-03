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
      <nav className="catalog-filters" aria-label="Course categories">
        <a className="filter-chip" href="#proficiency">Proficiency Courses in French</a>
        <a className="filter-chip" href="/registration">Registration Form</a>
        <a className="filter-chip" href="/specialized-tutoring">Specialized Tutoring</a>
        <a className="filter-chip" href="/research-assistance">Research Assistance</a>
      </nav>
      <section className="course-category-section" id="proficiency">
        <p className="eyebrow">01 / Proficiency Courses in French</p>
        <h2>Three months. A new level of confidence.</h2>
        <div className="course-program-grid">
          {[
            ['beginner', 'Beginner', 'Build your foundation with pronunciation, everyday vocabulary, simple grammar, and practical conversations.'],
            ['intermediate', 'Intermediate', 'Develop your fluency with richer conversations, reading, writing, and grammar in context.'],
            ['advanced', 'Advanced', 'Refine your expression through complex texts, extended discussion, and precise written French.'],
          ].map(([id, name, description]) => <article className="course-program" id={id} key={id}><p className="eyebrow">3-month program</p><h3>3-month {name} French</h3><p>{description}</p><a className="button-outline" href={`/registration?program=${id}`}>Registration Form</a></article>)}
        </div>
        <h3>Available course lessons</h3>
        <CourseCatalog courses={result.courses} error={result.error} />
      </section>
      <section className="cta-band course-category-section" id="registration"><div><p className="eyebrow">02 / Registration Form</p><h2>Start your learning journey.</h2><p>Complete your learner details before starting a course.</p></div><a className="button" href="/registration">Open registration form</a></section>


      <section className="cta-band"><div><h2>Not sure where to begin?</h2><p>Start with the level that feels right. You can build from there.</p></div><a className="button-outline" href="/about">Explore our approach <span aria-hidden="true">→</span></a></section>
    </main>
  );
}
