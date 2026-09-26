import Link from 'next/link';

export type CourseSummary = {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  level: string;
  priceMinor: string | number;
  currency: string;
  legacyLanguage?: string | null;
  status?: string;
};

const coverStyles = ['green', 'sand', 'rose', 'blue'];
const coverWords: Record<string, string> = { BEGINNER: 'Bonjour', ELEMENTARY: 'Parlez', INTERMEDIATE: 'Voyage', UPPER_INTERMEDIATE: 'Culture', ADVANCED: 'Fluency', PROFICIENT: 'Maîtrise' };

export function formatCoursePrice(priceMinor: string | number, currency: string) {
  const amount = Number(priceMinor) / 100;
  if (!Number.isFinite(amount) || amount === 0) return 'Free';
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('en-NG')}`;
  }
}

export default function CourseCard({ course, index = 0 }: { course: CourseSummary; index?: number }) {
  const cover = coverStyles[index % coverStyles.length];
  return (
    <article className="course-card">
      <div className={`course-cover ${cover}`}><span className="course-cover-word">{coverWords[course.level] ?? 'Bonjour'}</span></div>
      <div className="course-card-body">
        <div className="course-meta"><span>{course.legacyLanguage ?? 'French'}</span><span className="pill">{course.level.replaceAll('_', ' ')}</span></div>
        <h3>{course.title}</h3>
        <p>{course.shortDescription || course.description || 'Build your confidence with a clear, tutor-led learning path.'}</p>
        <div className="course-card-bottom"><span className="course-price">{formatCoursePrice(course.priceMinor, course.currency)}</span><Link className="course-arrow" href={`/courses/${course.slug}`} aria-label={`View ${course.title}`}>↗</Link></div>
      </div>
    </article>
  );
}
