import Link from 'next/link';
import AccountActions from './account-actions';

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link className={`brand${inverse ? ' brand-inverse' : ''}`} href="/" aria-label="Transligual home">
      <span className="brand-mark" aria-hidden="true">T</span>
      <span className="brand-word">Trans<span>lingual</span></span>
    </Link>
  );
}

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand />
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/courses">French courses</Link>
          <Link href="/services/translation">Translation</Link>
          <Link href="/services/interpretation">Interpretation</Link>
          <Link href="/about">Our approach</Link>
        </nav>
        <AccountActions />
      </div>
    </header>
  );
}
