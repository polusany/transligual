'use client';

import Link from 'next/link';
import CertificateTour from './certificate-tour';
import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

type Certificate = { id: string; certificateNumber: string; verificationCode: string; issuedAt: string; status: string; course: { title: string } };

export default function CertificatesPage() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiRequest<Certificate[]>('/certificates/me').then(setItems).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Certificates could not be loaded.')).finally(() => setLoading(false));
  }, []);
  return <main className="page-shell dashboard-page"><CertificateTour /><section id="earned-certificates" className="ct-earned-heading"><p className="eyebrow">Your achievements</p><h2>Your earned certificates</h2><p>Download and verify the certificates you have earned.</p></section>{error && <section className="empty-state"><h2>We couldn’t load your certificates</h2><p>{error}</p><Link className="button" href="/login">Sign in →</Link></section>}{loading && <section className="empty-state"><h2>Loading certificates…</h2></section>}{!loading && !error && (items.length ? <div className="certificate-grid">{items.map((certificate) => <article className="certificate-card" key={certificate.id}><p className="eyebrow">Transligual · Certificate of completion</p><h2>{certificate.course.title}</h2><p>Certificate number <strong>{certificate.certificateNumber}</strong></p><p>Issued {new Date(certificate.issuedAt).toLocaleDateString()}</p><span className={`pill ${certificate.status === 'ACTIVE' ? '' : 'pill-muted'}`}>{certificate.status.toLowerCase()}</span><p className="verify-code">Verification code: <code>{certificate.verificationCode}</code></p><Link className="text-link" href={`/certificates/verify?code=${encodeURIComponent(certificate.verificationCode)}`}>Verify certificate →</Link><a className="button-outline" href={`/api/v1/certificates/${certificate.id}/pdf`}>Download PDF</a><button className="button-outline print-button" onClick={() => window.print()}>Print / save as PDF</button></article>)}</div> : <section className="empty-state"><h2>Your first certificate is ahead.</h2><p>Complete a certificate-enabled course to see your achievement here.</p><Link className="button" href="/courses">Browse courses →</Link></section>)}</main>;
}
