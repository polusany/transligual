'use client';

import { useEffect } from 'react';

// Preserve existing email links while handling verification at sign-in.
export default function VerifyEmailPage() {
  useEffect(() => { window.location.replace(`/login${window.location.hash}`); }, []);
  return <main className="page-shell"><p role="status">Opening sign in…</p></main>;
}
