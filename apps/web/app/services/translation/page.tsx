import type { Metadata } from 'next';
import Translator from './translator';

export const metadata: Metadata = { title: 'Instant translation' };
export default function TranslationPage() {
  return <main className="page-shell"><header className="page-intro"><p className="eyebrow">Translation tool</p><h1>Find the words in another language.</h1><p>Translate text immediately across popular languages. Select a source language or let us detect it, then choose your target.</p></header><Translator /></main>;
}
