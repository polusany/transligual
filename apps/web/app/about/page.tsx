'use client';
import Link from 'next/link';
import { useState } from 'react';
import './about.css';
const services = [
  { title: 'French proficiency courses', description: 'Build your French with 3-month beginner, intermediate, and advanced programs.', href: '/courses' },
  { title: 'Learner registration', description: 'Choose your program and share your current French level and learning goals.', href: '/registration' },
  { title: 'Certificates', description: 'Complete your course and assessments, then view and verify your achievement.', href: '/certificates', featured: true },
  { title: 'Specialized tutoring', description: 'Explore focused French learning for your individual goals.', href: '/courses#specialized-tutoring' },
  { title: 'Translation', description: 'Request text translation and follow replies from your account.', href: '/services/translation' },
  { title: 'Interpretation', description: 'Request language support for meetings, conversations, and appointments.', href: '/services/interpretation' },
  { title: 'Research assistance', description: 'Explore research support and language assistance for academic work.', href: '/courses#research-assistance' },
  { title: 'Become a tutor', description: 'Apply to share your language knowledge with Translingual learners.', href: '/teach/apply' },
  { title: 'Course records', description: 'Print your courses, certificate eligibility, and payment history.', href: '/course-record' },
];
export default function AboutPage() {
  const [filter, setFilter] = useState('');
  const matches = services.filter(service => `${service.title} ${service.description}`.toLowerCase().includes(filter.trim().toLowerCase()));
  return <main className="about-services"><div className="about-services-inner">
    <div className="about-services-heading"><div><p className="eyebrow">About Translingual</p><h1>All our services</h1></div><div className="about-services-filter"><label className="sr-only" htmlFor="service-filter">Filter services</label><input id="service-filter" type="search" placeholder="Filter services…" value={filter} onChange={event => setFilter(event.target.value)} /></div></div>
    <p className="about-services-intro">Translingual brings French education and professional language services together, helping learners build skills and helping people communicate across languages.</p>
    <div className="about-services-grid">{matches.map(service => <Link key={service.title} href={service.href} className={`about-service-card${service.featured ? ' featured' : ''}`}><h2>{service.title}</h2><p>{service.description}</p><span>Explore <span aria-hidden="true">→</span></span></Link>)}</div>
    {!matches.length && <p role="status">No services match your search. Try another term.</p>}
  </div></main>;
}
