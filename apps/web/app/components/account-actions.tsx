'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiRequest, CurrentUser } from '../lib/api';

export default function AccountActions() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    apiRequest<CurrentUser>('/auth/me')
      .then(setUser)
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, [pathname]);

  if (!ready || !user) return <div className="site-actions"><Link className="nav-login" href="/login">Sign in</Link><Link className="button button-small" href="/login?mode=register">Get started <span aria-hidden="true">↗</span></Link></div>;

  const isAdmin = user.roles.some((role) => ['ADMIN', 'SUPER_ADMIN'].includes(role));
  const isTutor = user.roles.includes('TUTOR');
  const href = isAdmin ? '/admin' : isTutor ? '/instructor/courses' : '/dashboard';
  const label = isAdmin ? 'Admin console' : isTutor ? 'Tutor studio' : 'My dashboard';
  const name = user.profile?.displayName || user.profile?.firstName || label;

  async function signOut() {
    await apiRequest('/auth/logout', { method: 'POST' }).catch(() => undefined);
    window.location.assign('/');
  }

  return <div className="site-actions site-actions-signed"><span className="account-greeting">Hi, {name}</span>{isTutor && !isAdmin && <Link className="nav-login" href="/dashboard">My learning</Link>}<Link className="button button-small" href={href}>{label} <span aria-hidden="true">→</span></Link><button className="nav-signout" onClick={signOut}>Sign out</button></div>;
}
