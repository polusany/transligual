import TranslationRequests from '../../components/translation-requests';
export default function Page() {
  return <main className="page-shell"><header className="page-intro"><p className="eyebrow">Language services</p><h1>Translation requests</h1><p>Read submitted text and send a translated reply to the student. Replies appear in their request history.</p></header><TranslationRequests admin /></main>;
}
