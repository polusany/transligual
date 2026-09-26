import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Our approach' };

export default function AboutPage() {
  return (
    <main className="page-shell">
      <section className="about-hero"><p className="eyebrow">Our approach</p><h1>Language is how we meet the world.</h1><p>Transligual brings French learning and professional language services together around one idea: every person deserves to be understood.</p><div className="hero-actions"><Link className="button" href="/courses">Explore French courses <span aria-hidden="true">↗</span></Link><Link className="button-outline" href="/services/translation">Explore language services</Link></div></section>
      <section className="about-grid"><div><p className="eyebrow">Learning with purpose</p><h2>Make progress you can carry with you.</h2></div><div><p>Learning a language is personal. It takes practice, patience, and a path that makes sense for your goals. Transligual is being built to make that path clear, with structured learning, expert guidance, and practical ways to use what you learn.</p><p>We are starting with French education and growing toward a connected ecosystem for certification, translation, and interpretation. Each service is designed to respect context, culture, and the people on both sides of every conversation.</p><div className="contact-note">Our platform is growing. Course and service availability may vary while we complete the first release.</div></div></section>
      <section className="cta-band"><div><h2>Begin with a language you want to speak.</h2><p>Explore the course library and find a starting point that feels right.</p></div><Link className="button" href="/courses">Browse courses <span aria-hidden="true">→</span></Link></section>
    </main>
  );
}
