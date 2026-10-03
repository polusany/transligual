'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import './print.css';

type Certificate = { certificateNumber: string; verificationCode: string; issuedAt: string; status: string };
type RecordData = {
  generatedAt: string;
  learner: { email: string; profile: { firstName: string; lastName: string; displayName: string | null } | null; learnerRegistration: { fullName: string; program: string } | null };
  courses: { id: string; status: string; enrolledAt: string; completedAt: string | null; eligibility: string; course: { title: string }; certificate: Certificate | null }[];
  transactions: { id: string; providerReference: string; amountMinor: string; currency: string; status: string; paidAt: string | null; createdAt: string; items: { description: string; itemType: string; amountMinor: string }[] }[];
};
const labels: { [key: string]: string } = { NOT_OFFERED: 'Certificate not offered', REVOKED: 'Certificate revoked', INCOMPLETE: 'Course not completed', ASSESSMENTS_PENDING: 'Pass remaining assessments', ELIGIBLE: 'Eligible' };
const date = (value: string | null) => value ? new Date(value).toLocaleDateString('en-GB') : '—';
function amount(value: string, currency: string) {
  const minor = BigInt(value);
  const negative = minor < 0n;
  const absolute = negative ? -minor : minor;
  return `${currency} ${negative ? '-' : ''}${(absolute / 100n).toLocaleString('en-GB')}.${(absolute % 100n).toString().padStart(2, '0')}`;
}
export default function CourseRecordPage() {
  const [record, setRecord] = useState<RecordData | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { apiRequest<RecordData>('/course-record/me').then(setRecord).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Unable to load course record.')); }, []);
  if (error) return <main className="page-shell"><h1>Course record unavailable</h1><p role="alert">{error}</p><Link href="/login?next=%2Fcourse-record">Sign in</Link></main>;
  if (!record) return <main className="page-shell"><p role="status">Loading your course record…</p></main>;
  const name = record.learner.learnerRegistration?.fullName || record.learner.profile?.displayName || [record.learner.profile?.firstName, record.learner.profile?.lastName].filter(Boolean).join(' ') || 'Learner';
  return <main className="page-shell course-record">
    <div className="record-actions"><Link href="/dashboard" className="button-outline">Back to my course</Link><button type="button" className="button" onClick={() => window.print()}>Print / Save as PDF</button></div>
    <header><p className="eyebrow">Translingual · Learner course form</p><h1>Course and certificate record</h1><p><strong>{name}</strong><br />{record.learner.email}</p><p>Generated: {date(record.generatedAt)}</p></header>
    <section><h2>Courses and certificate eligibility</h2><p>Eligibility requires completing a certificate-enabled course and passing all its published assessments. This record is a summary; issued certificates can be verified using their public code.</p>
      {record.courses.length ? <div className="record-table-wrap"><table><thead><tr><th>Course</th><th>Status</th><th>Completed</th><th>Certificate eligibility</th></tr></thead><tbody>{record.courses.map(course => <tr key={course.id}><td>{course.course.title}</td><td>{course.status.replaceAll('_', ' ')}</td><td>{date(course.completedAt)}</td><td>{labels[course.eligibility]}{course.certificate && <div>Certificate: {course.certificate.certificateNumber}<br />Status: {course.certificate.status}<br />Issued: {date(course.certificate.issuedAt)}<br />Verification: <Link href={`/certificates/verify?code=${encodeURIComponent(course.certificate.verificationCode)}`}>{course.certificate.verificationCode}</Link></div>}</td></tr>)}</tbody></table></div> : <p>No courses enrolled yet.</p>}
    </section>
    <section><h2>Course and certificate transactions</h2><p>Course purchases and separate certification charges are labelled below. Only successful payments confirm payment.</p>
      {record.transactions.length ? <div className="record-table-wrap"><table><thead><tr><th>Date / Reference</th><th>Items</th><th>Transaction total</th><th>Status</th></tr></thead><tbody>{record.transactions.map(payment => <tr key={payment.id}><td>{date(payment.paidAt || payment.createdAt)}<br />{payment.providerReference}</td><td>{payment.items.map((item, index) => <div key={index}>{item.itemType === 'CERTIFICATION' ? 'Certificate' : item.itemType.replaceAll('_', ' ')}: {item.description} — {amount(item.amountMinor, payment.currency)}</div>)}</td><td>{amount(payment.amountMinor, payment.currency)}</td><td>{payment.status.replaceAll('_', ' ')}</td></tr>)}</tbody></table></div> : <p>No course or certificate transactions recorded.</p>}
    </section>
    <footer><p>Translingual learner record · Keep this form with your payment receipts and certificates.</p></footer>
  </main>;
}
