import Link from 'next/link';
import { notFound } from 'next/navigation';
import CourseCard, { CourseSummary } from '../../components/course-card';
import { serverApiUrl } from '../../lib/server-api';
const programs: Record<string, { name: string; description: string }> = {
  beginner: { name: 'Beginner', description: 'Build your foundation with pronunciation, everyday vocabulary, simple grammar, and practical conversations.' },
  intermediate: { name: 'Intermediate', description: 'Develop your fluency with richer conversations, reading, writing, and grammar in context.' },
  advanced: { name: 'Advanced', description: 'Refine your expression through complex texts, extended discussion, and precise written French.' },
};
export default async function ProgramPage({ params }: { params: Promise<{ program: string }> }) {
  const { program } = await params;
  if (!Object.hasOwn(programs, program)) notFound();
  const details = programs[program];
  if (!details) notFound();
  let courses: CourseSummary[] = [];
  let error = '';
  try {
    const response = await fetch(serverApiUrl('/courses'), { cache: 'no-store' });
    if (!response.ok) throw new Error('Unavailable');
    const payload = await response.json();
    courses = ((payload.data ?? payload) as CourseSummary[]).filter(course => course.program === program && course.status === 'PUBLISHED');
  } catch { error = 'Course materials are temporarily unavailable. Please try again shortly.'; }
  return <main className="page-shell dashboard-page"><header className="page-intro"><p className="eyebrow">French proficiency · 3-month program</p><h1>3-month {details.name} French</h1><p>{details.description}</p><div className="hero-actions"><Link className="button" href={`/registration?program=${program}`}>Registration Form</Link><Link className="button-outline" href="/dashboard">My learning dashboard</Link></div></header>
    <nav className="catalog-filters" aria-label="French programs">{Object.entries(programs).map(([key, value]) => <Link key={key} className="filter-chip" href={`/programs/${key}`} aria-current={key === program ? 'page' : undefined}>{value.name} French</Link>)}</nav>
    <section className="dashboard-section"><h2>Your program courses</h2><p>Open a course to view its curriculum and start your lessons. Videos, documents, and other materials are available inside each course.</p>
    {error ? <p role="alert">{error}</p> : courses.length ? <div className="course-grid">{courses.map((course, index) => <CourseCard key={course.id} course={course} index={index} />)}</div> : <div className="empty-state"><h3>Course content is being prepared.</h3><p>Published courses for this program will appear here once they are ready.</p></div>}</section></main>;
}
