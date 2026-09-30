'use client';

import { useState } from 'react';

const languages = ['English', 'French', 'Arabic', 'Chinese', 'German', 'Hausa', 'Igbo', 'Italian', 'Portuguese', 'Spanish', 'Yoruba'];

export default function LanguageSelect({ label, name, value, onChange }: {
  label: string; name: string; value?: string; onChange?: (value: string) => void;
}) {
  const [selection, setSelection] = useState(value ?? '');
  const other = selection === 'other';
  return <div className="language-field">
    <label>{label}<select name={other ? undefined : name} value={selection} required onChange={event => {
      const next = event.target.value;
      setSelection(next);
      onChange?.(next === 'other' ? '' : next);
    }}>
      <option value="" disabled>Choose a language</option>
      {languages.map(language => <option key={language} value={language}>{language}</option>)}
      <option value="other">Other language…</option>
    </select></label>
    {other && <label>Specify {label.toLowerCase()}<input name={name} required minLength={2} maxLength={80} onChange={event => onChange?.(event.target.value)} /></label>}
  </div>;
}
