import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CourseSummary, formatCoursePrice } from '../../components/course-card';
import EnrollButton from '../../components/enroll-button';
import { serverApiUrl } from '../../lib/server-api';

type CourseDetail = CourseSummary & {
  estimatedDurationMinutes?: number | null;
  certificateEnabled?: boolean;
  modules?: Array<{ id: string; title: string; description?: string | null; lessons: Array<{ id: string; title: string; description?: string | null; lessonType: string; isPreview: boolean; durationMinutes?: number | null }> }>;
  category?: { name: string };
  tutor?: { profile?: { displayName?: string | null; firstName?: string | null } | null };
};

async function getCourse(slug: string): Promise<CourseDetail | null> {
  try {
    const response = await fetch(serverApiUrl(`/courses/${encodeURIComponent(slug)}`), { cache: 'no-store' });
    if (!response.ok) return null;
    const payload = await response.json();
    return (payload?.data ?? payload) as CourseDetail;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  return { title: course?.title ?? 'Course details' };
}

export default async function CourseDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();
  const tutor = course.tutor?.profile?.displayName || course.tutor?.profile?.firstName || 'Transligual tutor';
  const lessons = course.modules?.reduce((total, module) => total + module.lessons.length, 0) ?? 0;
  const duration = course.estimatedDurationMinutes ? `${Math.round(course.estimatedDurationMinutes / 60)} hours` : 'Self-paced';

  return (
    <main className="page-shell">
      <section className="detail-hero">
        <p className="eyebrow">{course.category?.name ?? 'French course'} · {course.level.replaceAll('_', ' ')}</p>
        <h1>{course.title}</h1>
        <p>{course.shortDescription || course.description}</p>
        <p className="detail-byline">Designed by <strong>{tutor}</strong></p>
      </section>
      <div className="detail-layout">
        <div>
          <section className="detail-panel"><h2>What you’ll learn</h2><p>{course.description}</p></section>
          <section className="detail-panel curriculum-panel"><h2>Course curriculum</h2><p className="hint">{course.modules?.length ?? 0} sections · {lessons} lessons · {duration}</p>
            {course.modules?.length ? course.modules.map((module, moduleIndex) => <div key={module.id} className="curriculum-module"><h3>{String(moduleIndex + 1).padStart(2, '0')} &nbsp; {module.title}</h3>{module.description && <p>{module.description}</p>}{module.lessons.map((lesson) => <div className="curriculum-row" key={lesson.id}><span className="lesson-dot" aria-hidden="true">{lesson.isPreview ? '▶' : '•'}</span><div><h4>{lesson.title}</h4><p>{lesson.lessonType.replaceAll('_', ' ').toLowerCase()}{lesson.durationMinutes ? ` · ${lesson.durationMinutes} min` : ''}{lesson.isPreview ? ' · Preview' : ''}</p></div></div>)}</div>) : <p className="hint">Course lessons will appear here as the tutor builds the curriculum.</p>}
          </section>
        </div>
        <aside className="sticky-summary"><span className="pill">{course.legacyLanguage ?? 'French'}</span><p className="price-large">{formatCoursePrice(course.priceMinor, course.currency)}</p><p className="hint">Learn on your schedule with a structured course path and clear milestones.</p><EnrollButton courseId={course.id} slug={course.slug} isFree={Number(course.priceMinor) === 0}/><ul className="summary-list"><li>{lessons || 'Flexible'} lessons</li><li>{duration} learning</li><li>{course.certificateEnabled ? 'Certificate available on completion' : 'Learn at your own pace'}</li></ul></aside>
      </div>
    </main>
  );
}
