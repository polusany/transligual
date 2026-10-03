import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Specialized Tutoring' };

export default function ServicePage() {
  return <main className="page-shell"><header className="page-intro"><p className="eyebrow">Courses and learning support</p><h1>Specialized Tutoring</h1><p>Focused French learning for your personal, academic, and professional goals.</p></header>
      <section className="course-category-section" id="specialized-tutoring"><p className="eyebrow">Specialized Tutoring</p><h2>French support focused on your goals.</h2><div className="course-program-grid">{[
        ['Conversation and pronunciation', 'Build speaking confidence with guided conversation and pronunciation practice.'],
        ['Exam and academic preparation', 'Strengthen comprehension, grammar, and writing with focused study support.'],
        ['Professional French', 'Practice French for workplace communication, presentations, and professional correspondence.'],
      ].map(([title, description]) => <article className="course-program" key={title}><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <section className="cta-band"><div><h2>Tell us what you need.</h2><p>Complete your registration and describe your goals so we can understand the support you are looking for.</p></div><Link className="button" href="/registration?program=specialized-tutoring">Registration Form</Link></section><p><Link className="text-link" href="/courses">Back to Courses →</Link></p>
  </main>;
}
