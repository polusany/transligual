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
          <Link onClick={() => setOpen(false)} href="/courses">French courses</Link>
          <Link onClick={() => setOpen(false)} href="/services/translation">Translation</Link>
          <Link onClick={() => setOpen(false)} href="/services/interpretation">Interpretation</Link>
          <Link onClick={() => setOpen(false)} href="/about">Our approach</Link>
        </nav>
        <AccountActions />
      </div>
    </header>
  );
}
