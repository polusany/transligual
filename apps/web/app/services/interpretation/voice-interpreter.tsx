'use client';

import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../../lib/api';

const languages = [
  ['en', 'English', 'en-US'], ['fr', 'French', 'fr-FR'], ['ar', 'Arabic', 'ar-SA'],
  ['ha', 'Hausa', 'ha-NG'], ['ig', 'Igbo', 'ig-NG'], ['yo', 'Yoruba', 'yo-NG'],
] as const;

type RecognitionResultLike = { transcript: string };
type RecognitionEventLike = { results: ArrayLike<ArrayLike<RecognitionResultLike>> };
type RecognitionLike = { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; onresult: ((event: RecognitionEventLike) => void) | null; onerror: ((event: { error: string }) => void) | null; };
type RecognitionConstructor = new () => RecognitionLike;
type Translation = { translatedText: string; sourceLanguage: string | null; targetLanguage: string };
const localeFor = (code: string) => languages.find(([language]) => language === code)?.[2] ?? 'en-US';

export default function VoiceInterpreter() {
  const [sourceLanguage, setSourceLanguage] = useState('en'); const [targetLanguage, setTargetLanguage] = useState('fr');
  const [transcript, setTranscript] = useState(''); const [translation, setTranslation] = useState(''); const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Record a short message, then translate and play it aloud.');
  const recorderRef = useRef<MediaRecorder | null>(null); const recognitionRef = useRef<RecognitionLike | null>(null); const audioUrlRef = useRef<string | null>(null);
  useEffect(() => () => { if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current); }, []);

  async function startRecording() {
    setTranslation('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream); recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => { stream.getTracks().forEach((track) => track.stop()); if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current); const url = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })); audioUrlRef.current = url; setAudioUrl(url); };
      recorder.start(); recorderRef.current = recorder;
      const browser = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
      const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
      if (Recognition) { const recognition = new Recognition(); recognition.lang = localeFor(sourceLanguage); recognition.continuous = true; recognition.interimResults = false; recognition.onresult = (event) => setTranscript(Array.from(event.results).map((result) => result[0]?.transcript ?? '').join(' ').trim()); recognition.onerror = () => setMessage('Audio was saved. If no words appear, type the message below before translating.'); recognition.start(); recognitionRef.current = recognition; }
      else setMessage('Audio is recording. Enter the spoken words below because this browser has no speech recognition.');
      setRecording(true); setMessage('Listening… select Stop recording when you finish speaking.');
    } catch { setMessage('Microphone access is blocked. Allow microphone permission in your browser and try again.'); }
  }
  function stopRecording() { recorderRef.current?.stop(); recognitionRef.current?.stop(); setRecording(false); setMessage('Recording saved. Review the text, then translate it.'); }
  async function translate() {
    if (!transcript.trim()) { setMessage('Record a message or enter text before translating.'); return; }
    if (sourceLanguage === targetLanguage) { setMessage('Choose different source and target languages.'); return; }
    setBusy(true); setTranslation(''); setMessage('Translating…');
    try { const result = await apiRequest<Translation>('/translations/translate', { method: 'POST', body: JSON.stringify({ text: transcript, sourceLanguage, targetLanguage }) }); setTranslation(result.translatedText); setMessage('Translation ready. Use Listen to hear it aloud.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Translation could not be completed. Please try again.'); } finally { setBusy(false); }
  }
  function listen() { if (!translation) return; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(translation); utterance.lang = localeFor(targetLanguage); window.speechSynthesis.speak(utterance); }

  return <section className="voice-interpreter" aria-labelledby="voice-translator-title">
    <div className="voice-interpreter-heading"><div><p className="eyebrow">Instant voice translation</p><h2 id="voice-translator-title">Speak once. Be understood.</h2></div><span className="pill">Voice to text & voice</span></div>
    <p className="voice-interpreter-lede">Record your message, review its text, translate it, then listen to the result. Your recording remains in this browser.</p>
    <div className="voice-languages"><label>From<select value={sourceLanguage} onChange={(event) => { setSourceLanguage(event.target.value); setTranslation(''); }}>{languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label><span aria-hidden="true">→</span><label>To<select value={targetLanguage} onChange={(event) => { setTargetLanguage(event.target.value); setTranslation(''); }}>{languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label></div>
    <div className="voice-recorder"><button type="button" className={recording ? 'button voice-stop' : 'button voice-record'} onClick={recording ? stopRecording : startRecording}>{recording ? '■ Stop recording' : '● Start recording'}</button><p role="status" aria-live="polite">{message}</p>{audioUrl && <audio controls src={audioUrl}>Your browser cannot play this recording.</audio>}</div>
    <label className="voice-textarea">What was said<textarea value={transcript} onChange={(event) => { setTranscript(event.target.value); setTranslation(''); }} rows={5} maxLength={5000} placeholder="Your spoken words will appear here. You can also type or correct them." /></label>
    <button type="button" className="button voice-translate" onClick={translate} disabled={busy || !transcript.trim()}>{busy ? 'Translating…' : 'Translate message →'}</button>
    {translation && <div className="voice-result"><div><p className="eyebrow">Translation</p><p lang={localeFor(targetLanguage)}>{translation}</p></div><button type="button" className="button-outline" onClick={listen}>▶ Listen</button></div>}
    <p className="voice-privacy">Use a modern browser and allow microphone access. Browser support determines which spoken languages can be transcribed.</p>
  </section>;
}
