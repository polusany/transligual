'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brand, default as SiteHeader } from './site-header';
import SiteFooter from './site-footer';
import AdminPortalNavigation from './admin-portal-navigation';
import AccountActions from './account-actions';

function WorkspaceHeader({ kind }: { kind: 'learner' | 'tutor' }) {
  const isLearner = kind === 'learner';
  return <header className={`workspace-header ${isLearner ? 'learner-header' : 'tutor-header'}`}>
    <div className="workspace-header-inner"><Brand />
      <nav aria-label={isLearner ? 'Learner workspace' : 'Tutor workspace'}>
        {isLearner ? <><Link href="/dashboard">Overview</Link><Link href="/courses">Browse courses</Link><Link href="/certificates">Certificates</Link></> : <><Link href="/instructor/courses">Course studio</Link><Link href="/instructor/courses/new">Create a course</Link><Link href="/teach/apply">Tutor profile</Link></>}
      </nav>
      <div className="workspace-header-actions"><AccountActions /><Link className="button button-small" href="/">Public site <span aria-hidden="true">↗</span></Link></div>
    </div>
  </header>;
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  const isLearner = pathname === '/dashboard' || pathname === '/certificates' || /^\/courses\/[^/]+\/learn$/.test(pathname);
  const isTutor = pathname.startsWith('/instructor/');
  if (isAdmin) return pathname === '/admin' || pathname === '/admin/login' ? <>{children}</> : <div className="admin-secondary-shell"><AdminPortalNavigation /><div className="admin-secondary-content">{children}</div></div>;
  if (isLearner) return <><WorkspaceHeader kind="learner" />{children}</>;
  if (isTutor) return <><WorkspaceHeader kind="tutor" />{children}</>;
  return <><SiteHeader />{children}<SiteFooter /></>;
}
