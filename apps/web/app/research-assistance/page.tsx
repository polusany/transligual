import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Research Assistance' };

export default function ServicePage() {
  return <main className="page-shell"><header className="page-intro"><p className="eyebrow">Courses and learning support</p><h1>Research Assistance</h1><p>Support to plan, understand, and communicate your research with confidence.</p></header>
      <section className="course-category-section" id="research-assistance"><p className="eyebrow">Research Assistance</p><h2>Guidance at every stage of your research.</h2><div className="course-program-grid">{[
        ['Topic and proposal guidance', 'Refine your research question, objectives, scope, and proposal structure.'],
        ['Literature review support', 'Find relevant sources, evaluate evidence, and organize your literature review.'],
        ['Research methodology', 'Get guidance on research design, sampling, and data collection methods.'],
        ['Data analysis support', 'Understand analysis methods and present and interpret your findings.'],
        ['Academic editing and referencing', 'Improve clarity, structure, citations, and reference-list consistency.'],
        ['French-language research support', 'Get help understanding French sources and communicating research across languages.'],
      ].map(([title, description]) => <article className="course-program" key={title}><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <section className="cta-band"><div><h2>Tell us what you need.</h2><p>Complete your registration and describe your goals so we can understand the support you are looking for.</p></div><Link className="button" href="/registration?program=research-assistance">Registration Form</Link></section><p><Link className="text-link" href="/courses">Back to Courses →</Link></p>
  </main>;
}
