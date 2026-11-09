import type { Metadata } from 'next';
import InterpretationRequestForm from './request-form';
import VoiceInterpreter from './voice-interpreter';

export const metadata: Metadata = { title: 'Interpretation services' };
export default function InterpretationPage() {
  return <main className="page-shell"><header className="page-intro"><p className="eyebrow">Interpretation services</p><h1>Be understood when the conversation matters.</h1><p>Speak directly with our instant voice interpreter, or arrange a professional interpreter for an important conversation.</p></header><VoiceInterpreter /><div className="service-overview"><div><span className="value-number">01</span><h2>Request a time</h2><p>Choose the languages, format, and a time in your local timezone.</p></div><div><span className="value-number">02</span><h2>Confirm the details</h2><p>Our team reviews your request and confirms availability and pricing.</p></div><div><span className="value-number">03</span><h2>Get ready to speak</h2><p>Scheduling details are confirmed before a booking is finalized.</p></div></div><InterpretationRequestForm /></main>;
}
