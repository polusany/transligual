import Link from 'next/link';
import { Brand } from './site-header';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand-block">
          <Brand inverse />
          <p>Language connects people, opportunity, and ideas. We help you move between them with confidence.</p>
        </div>
        <div className="footer-links">
          <div><p className="footer-label">Learn</p><Link href="/courses">French courses</Link><Link href="/certificates">Certification</Link><Link href="/certificates/verify">Verify a certificate</Link></div>
          <div><p className="footer-label">Language services</p><Link href="/services/translation">Translation</Link><Link href="/services/interpretation">Interpretation</Link></div>
          <div><p className="footer-label">Your account</p><Link href="/login">Learner sign in</Link><Link href="/dashboard">My course</Link><Link href="/instructor/courses">Tutor dashboard</Link><Link href="/admin/login">Admin sign in</Link></div>
        </div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Translingual</span><span>Built for a world that speaks many languages.</span></div>
    </footer>
  );
}
