'use client';

import { useMemo, useState } from 'react';
import CourseCard, { CourseSummary } from '../components/course-card';

const levels = ['ALL', 'BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED'];

export default function CourseCatalog({ courses, error }: { courses: CourseSummary[]; error?: string }) {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('ALL');
  const visibleCourses = useMemo(() => courses.filter((course) => {
    const term = query.trim().toLowerCase();
    const matchesSearch = !term || `${course.title} ${course.shortDescription ?? course.description ?? ''} ${course.legacyLanguage ?? 'French'}`.toLowerCase().includes(term);
    return matchesSearch && (level === 'ALL' || course.level === level || (level === 'ADVANCED' && ['UPPER_INTERMEDIATE', 'PROFICIENT'].includes(course.level)));
  }), [courses, query, level]);

  return (
    <>
      <div className="catalog-toolbar">
        <p className="catalog-count">{visibleCourses.length} {visibleCourses.length === 1 ? 'course' : 'courses'} available</p>
        <label className="catalog-search"><span className="sr-only">Search courses</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search courses…" /></label>
        <div className="catalog-filters" role="group" aria-label="Filter by level">
          {levels.map((item) => <button key={item} type="button" className={`filter-chip${level === item ? ' active' : ''}`} aria-pressed={level === item} onClick={() => setLevel(item)}>{item === 'ALL' ? 'All levels' : item[0] + item.slice(1).toLowerCase()}</button>)}
        </div>
      </div>
      {error ? <div className="empty-state" role="alert"><h2>We couldn’t load the course library.</h2><p>{error}</p><button type="button" className="button" onClick={() => window.location.reload()}>Try again</button></div> : visibleCourses.length ? <div className="course-grid">{visibleCourses.map((course, index) => <CourseCard key={course.id} course={course} index={index}/>)}</div> : <div className="empty-state"><h2>{courses.length ? 'No courses match that search.' : 'New courses are on their way.'}</h2><p>{courses.length ? 'Try a different title or level to find what you’re looking for.' : 'Our tutors are preparing their first learning paths. Check back soon, or create an account to keep your learning space ready.'}</p>{courses.length ? <button type="button" className="button-outline" onClick={() => { setQuery(''); setLevel('ALL'); }}>Clear filters</button> : <a className="button" href="/login?mode=register">Create a learner account</a>}</div>}
    </>
  );
}
