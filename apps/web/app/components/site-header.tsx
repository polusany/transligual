'use client';

import Link from 'next/link';
import { useState } from 'react';
import AccountActions from './account-actions';

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link className={`brand${inverse ? ' brand-inverse' : ''}`} href="/" aria-label="Translingual home">
      <span className="brand-mark" aria-hidden="true">T</span>
      <span className="brand-word">Trans<span>lingual</span></span>
    </Link>
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand />
        <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen((value) => !value)}>
          <span className="sr-only">{open ? 'Close' : 'Open'} menu</span><span aria-hidden="true">☰</span>
        </button>
        <nav id="main-navigation" className={`site-nav${open ? ' is-open' : ''}`} aria-label="Main navigation">
          <details className="courses-menu">
            <summary>Courses</summary>
            <div className="courses-menu-links" onClick={(event) => { if ((event.target as HTMLElement).closest('a')) { event.currentTarget.closest('details')?.removeAttribute('open'); setOpen(false); } }}>
              <Link href="/courses">All courses and services</Link>
              <Link href="/courses#proficiency">Proficiency Courses in French</Link>
              <Link href="/registration?program=beginner">3-month Beginner French</Link>
              <Link href="/registration?program=intermediate">3-month Intermediate French</Link>
              <Link href="/registration?program=advanced">3-month Advanced French</Link>
              <Link href="/registration">Registration Form</Link>
              <Link href="/specialized-tutoring">Specialized Tutoring</Link>
              <Link href="/research-assistance">Research Assistance</Link>
            </div>
          </details>
          <Link onClick={() => setOpen(false)} href="/services/translation">Translation</Link>
          <Link onClick={() => setOpen(false)} href="/services/interpretation">Interpretation</Link>
          <Link onClick={() => setOpen(false)} href="/about">Our approach</Link>
          <Link onClick={() => setOpen(false)} href="/teach/apply">Apply as a Tutor</Link>
        </nav>
        <AccountActions />
      </div>
    </header>
  );
}
