import type { Metadata } from 'next';
import Translator from './translator';

export const metadata: Metadata = { title: 'Instant translation' };
export default function TranslationPage() {
  return <main className="page-shell"><header className="page-intro"><p className="eyebrow">Instant translation</p><h1>Find the words in another language.</h1><p>Translate text automatically between French, English, and other languages. Choose a language or let the bot detect it for you.</p></header><Translator /></main>;
}
