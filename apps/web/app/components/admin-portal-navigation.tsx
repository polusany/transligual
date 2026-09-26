'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminPortalNavigation() {
  const pathname = usePathname();
  return <aside className="admin-rail admin-shared-rail"><Link className="admin-brand" href="/admin"><span className="admin-brand-mark">T</span><span>Translingual<small>ADMIN CONSOLE</small></span></Link><p className="admin-rail-label">WORKSPACE</p><nav aria-label="Admin workspace"><Link className={pathname === '/admin' ? 'active' : ''} href="/admin">Overview</Link><Link className={pathname.startsWith('/admin/courses') ? 'active' : ''} href="/admin/courses">Course manager</Link><Link href="/admin#course-reviews">Course reviews</Link><Link href="/admin#tutor-applications">Tutor applications</Link></nav><div className="admin-rail-bottom"><Link href="/dashboard">Learner dashboard ↗</Link><Link href="/">Public site ↗</Link><Link href="/admin/login">Admin sign-in ↗</Link></div></aside>;
}
