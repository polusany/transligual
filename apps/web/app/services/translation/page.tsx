import type { Metadata } from 'next';
import Translator from './translator';

export const metadata: Metadata = { title: 'Text translation requests' };
export default function TranslationPage() {
  return <main className="page-shell"><header className="page-intro"><p className="eyebrow">Admin-assisted translation</p><h1>Find the words in another language.</h1><p>Submit your text and the languages you need. An administrator will review your request and reply in your account.</p></header><Translator /></main>;
}
