'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';

type Service = { id: string; name: string; description?: string | null; durationUnit: string; basePriceMinor?: string | null; currency?: string | null };
type Booking = { id: string; status: string };
export default function InterpretationRequestForm() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { apiRequest<Service[]>('/interpretation/services').then(setServices).catch(() => setError('Interpretation services are temporarily unavailable.')); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget); const start = new Date(String(form.get('scheduledStartAt'))); const durationMinutes = Number(form.get('durationMinutes'));
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(durationMinutes)) { setError('Choose a date, time, and duration.'); return; }
    const end = new Date(start.getTime() + durationMinutes * 60_000); setBusy(true);
    try {
      const booking = await apiRequest<Booking>('/interpretation/bookings', { method: 'POST', body: JSON.stringify({ serviceId: form.get('serviceId'), sourceLanguage: form.get('sourceLanguage'), targetLanguage: form.get('targetLanguage'), scheduledStartAt: start.toISOString(), scheduledEndAt: end.toISOString(), customerTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone, locationType: form.get('locationType'), locationDetails: form.get('locationDetails'), eventDetails: form.get('eventDetails') }) });
      setResult(booking);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'We couldn’t submit your booking request. Please try again.'); }
    finally { setBusy(false); }
  }
  return <section className="form-card service-form-card"><p className="eyebrow">Request a booking</p><h2>{result ? 'Your request is with our team.' : 'Plan your interpretation'}</h2>{result ? <div className="form-success" role="status"><strong>We’ve received your request.</strong><br/>Reference: {result.id}<br/>Your booking is not confirmed until timing and pricing are reviewed. <Link href="/dashboard">View your learning space</Link>.</div> : <><p>Choose the service and time that best fit your plans. Requests are reviewed before confirmation.</p><form onSubmit={submit}><label>Service<select name="serviceId" defaultValue="" required><option value="" disabled>{services.length ? 'Choose an interpretation service' : 'Loading services…'}</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label><div className="form-row"><label>From<input name="sourceLanguage" placeholder="French" required maxLength={80}/></label><label>Into<input name="targetLanguage" placeholder="English" required maxLength={80}/></label></div><div className="form-row"><label>Date and start time<input name="scheduledStartAt" type="datetime-local" min={new Date(Date.now()+60_000).toISOString().slice(0,16)} required/><small>Shown in your local timezone.</small></label><label>Estimated duration<select name="durationMinutes" defaultValue="60"><option value="30">30 minutes</option><option value="60">1 hour</option><option value="90">1 hour 30 minutes</option><option value="120">2 hours</option><option value="240">Half day</option></select></label></div><div className="form-row"><label>Format<select name="locationType" defaultValue="ONLINE"><option value="ONLINE">Online</option><option value="CUSTOMER_LOCATION">At my location</option><option value="VENUE">At a venue</option></select></label><label>Location details<input name="locationDetails" placeholder="Optional until confirmed" maxLength={1000}/></label></div><label>Meeting or event details<textarea name="eventDetails" rows={4} maxLength={3000} placeholder="Purpose, participants, subject, or access needs."/></label>{error && <p className="form-error" role="alert">{error}{error.startsWith('Sign in') && <> <Link href="/login">Sign in</Link></>}</p>}<button className="button" disabled={busy || !services.length}>{busy ? 'Sending request…' : 'Request interpretation'} <span aria-hidden="true">→</span></button></form></>}</section>;
}
