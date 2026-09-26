import Link from 'next/link';
import CourseCard, { CourseSummary } from './components/course-card';
import { serverApiUrl } from './lib/server-api';

async function getFeaturedCourses(): Promise<CourseSummary[]> {
  try {
    const response = await fetch(serverApiUrl('/courses'), { cache: 'no-store' });
    if (!response.ok) return [];
    const payload = await response.json();
    const courses = (payload?.data ?? payload) as CourseSummary[];
    return courses.filter((course) => course.status === 'PUBLISHED').slice(0, 3);
  } catch {
    return [];
  }
}

export default async function Home() {
  const courses = await getFeaturedCourses();
  return (
    <main>
      <div className="page-shell">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Language opens new doors</p>
            <h1>Make French part of <em>your story.</em></h1>
            <p className="hero-lede">Learn with expert tutors, gain confidence step by step, and find the right words wherever life takes you.</p>
            <div className="hero-actions"><Link className="button" href="/courses">Explore French courses <span aria-hidden="true">↗</span></Link><Link className="button-outline" href="/about">Discover Transligual</Link></div>
            <p className="hero-note">Thoughtful learning. Human expertise. A world of possibility.</p>
          </div>
          <div className="hero-art" aria-label="Illustration inspired by French language and culture" role="img">
            <div className="art-orbit" />
            <div className="art-core"><div className="art-topline"><span>Transligual</span><span>01 / FR</span></div><span className="art-bigword">Bonjour</span><div className="art-caption"><span>Learn with purpose</span><span>2026</span></div></div>
            <div className="art-corner one">é</div><div className="art-corner two">à</div>
            <div className="floating-card"><strong>À votre rythme</strong><span>Progress that fits your life</span></div>
          </div>
        </section>
        <div className="trust-strip"><div className="trust-item"><span className="trust-dot"/>Expert-led French learning</div><div className="trust-item"><span className="trust-dot"/>Clear paths from first words to fluency</div><div className="trust-item"><span className="trust-dot"/>Translation and interpretation expertise</div></div>

        <section className="section-block">
          <div className="section-heading"><div><p className="eyebrow">Start learning</p><h2>Build your French, one confident step at a time.</h2></div><Link className="text-link" href="/courses">Browse all courses <span aria-hidden="true">→</span></Link></div>
          {courses.length ? <div className="course-grid">{courses.map((course, index) => <CourseCard key={course.id} course={course} index={index}/>)}</div> : <div className="empty-state"><h2>Your next chapter starts here.</h2><p>Our course catalogue is being prepared. Explore the learning path and check back soon for published courses.</p><Link className="button" href="/courses">Visit the course library</Link></div>}
        </section>

        <section className="section-block" style={{paddingTop:0}}>
          <div className="section-heading"><div><p className="eyebrow">More than language lessons</p><h2>One trusted place for language learning and services.</h2></div><p>Whether you are learning French or working across languages, we make every conversation clearer.</p></div>
          <div className="service-grid">
            <article className="service-card"><span className="service-index">01 / INSTANT TRANSLATION</span><h3>Your words, understood everywhere.</h3><p>Translate text across languages in seconds, right from your browser.</p><Link className="text-link" href="/services/translation">Open the translator <span aria-hidden="true">→</span></Link><div className="service-orb"/></article>
            <article className="service-card"><span className="service-index">02 / INTERPRETATION</span><h3>Make every conversation count.</h3><p>Plan a language-supported meeting, appointment, or event with confidence.</p><Link className="text-link" href="/services/interpretation">Explore interpretation <span aria-hidden="true">→</span></Link><div className="service-orb"/></article>
          </div>
        </section>

        <section className="section-block" style={{paddingTop:0}}>
          <div className="section-heading"><div><p className="eyebrow">Why Transligual</p><h2>Human expertise, with a clear path forward.</h2></div></div>
          <div className="values-grid"><article className="value-card"><span className="value-number">01</span><h3>Learning with structure</h3><p>Follow a focused path with practical lessons, helpful guidance, and progress you can see.</p></article><article className="value-card"><span className="value-number">02</span><h3>People at the centre</h3><p>Learn and work with specialists who understand context, culture, and the value of being heard.</p></article><article className="value-card"><span className="value-number">03</span><h3>Confidence that travels</h3><p>Build language skills you can carry into study, work, travel, and everyday life.</p></article></div>
        </section>

        <section className="cta-band"><div><h2>Ready to begin?</h2><p>Find your first French course and start learning at your pace.</p></div><Link className="button" href="/courses">Find your course <span aria-hidden="true">↗</span></Link></section>
      </div>
    </main>
  );
}
