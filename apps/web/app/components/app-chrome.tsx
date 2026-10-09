'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Brand, default as SiteHeader } from './site-header';
import SiteFooter from './site-footer';
import AdminPortalNavigation from './admin-portal-navigation';
import AccountActions from './account-actions';
import SupportChatbox from './support-chatbox';

function WorkspaceHeader({ kind }: { kind: 'learner' | 'tutor' }) {
  const isLearner = kind === 'learner';
  const [open, setOpen] = useState(false);
  return <header className={`workspace-header ${isLearner ? 'learner-header' : 'tutor-header'}`}>
    <div className="workspace-header-inner"><Brand />
      <button className="menu-toggle" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="workspace-navigation" onClick={() => setOpen(!open)}>☰</button>
      <nav id="workspace-navigation" className={open ? "is-open" : ""} onClick={event => { if ((event.target as HTMLElement).closest("a")) setOpen(false); }} aria-label={isLearner ? 'Learner workspace' : 'Tutor workspace'}>
        {isLearner ? <><Link href="/dashboard">My course</Link><Link href="/courses">Browse courses</Link><Link href="/certificates">Certificates</Link><Link href="/course-record">Course form</Link><Link href="/certification-record">Certification form</Link></> : <><Link href="/instructor/courses">Course studio</Link><Link href="/instructor/courses/new">Create a course</Link><Link href="/teach/apply">Tutor profile</Link><Link href="/instructor/resignation">Resignation letter</Link></>}
      <div className="workspace-header-actions"><AccountActions /><Link className="button button-small" href="/">Public site <span aria-hidden="true">↗</span></Link></div></nav>
    </div>
  </header>;
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  const isLearner = pathname.startsWith('/programs/') || pathname === '/dashboard' || pathname === '/certificates' || pathname === '/course-record' || pathname === '/certification-record' || /^\/courses\/[^/]+\/learn$/.test(pathname);
  const isTutor = pathname.startsWith('/instructor/');
  if (isAdmin) return pathname === '/admin' || pathname === '/admin/login' ? <>{children}</> : <div className="admin-secondary-shell"><AdminPortalNavigation /><div className="admin-secondary-content">{children}</div></div>;
  if (isLearner) return <><WorkspaceHeader kind="learner" />{children}<SupportChatbox /></>;
  if (isTutor) return <><WorkspaceHeader kind="tutor" />{children}<SupportChatbox /></>;
  return <><SiteHeader />{children}<SiteFooter /><SupportChatbox /></>;
}
