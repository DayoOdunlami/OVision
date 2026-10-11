import { useState } from 'react';
import {
  normaliseNote, readNotes, saveNote, deleteNote, noteUrl, splitWords, weekday,
  DAY_NAMES, PRESETS, EASY_LEN, MAX_WORDS,
} from './note.js';

// ═══════════════════════════════════════════════════════════════════
// Write it for someone: a name, a few words (the same every day, or one
// for each day of the week) and a line beneath, kept on this device and
// sent as a link. Preview writes it in the sky behind the sheet.
// ═══════════════════════════════════════════════════════════════════

const blank = () => normaliseNote({ name: true, days: [{ words: '' }] });

export default function Composer({ onPreview, onClose }) {
  const [notes, setNotes] = useState(readNotes);
  const [draft, setDraft] = useState(() => {
    const all = readNotes();
    return all.length ? all[all.length - 1] : normaliseNote({ ...blank(), days: PRESETS[0].days });
  });
  const [day, setDay] = useState(weekday);
  const [msg, setMsg] = useState('');
  const week = draft.days.length === 7;
  const d = week ? day : 0;
  const cur = draft.days[d];

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2600); };
  const set = (patch) => setDraft((n) => ({ ...n, ...patch }));
  const setEntry = (patch) => setDraft((n) => ({ ...n, days: n.days.map((e, i) => (i === d ? { ...e, ...patch } : e)) }));
  const setWeek = (on) => setDraft((n) => {
    if (on === (n.days.length === 7)) return n;
    // Every day → a week: each day starts as that one; a week → every
    // day: keep the day being edited.
    return { ...n, days: on ? Array.from({ length: 7 }, () => ({ ...n.days[0] })) : [n.days[d]] };
  });
  const usePreset = (p) => {
    setDraft((n) => ({ ...n, days: p.days.map((e) => ({ ...e })) }));
    flash(`“${p.title}” filled in. Change anything.`);
  };

  const words = splitWords(cur.words);
  const long = words.filter((w) => w.length > EASY_LEN);
  const tooMany = cur.words.trim().split(/\s+/).filter(Boolean).length > MAX_WORDS;

  const save = () => {
    const n = saveNote(draft);
    setDraft(n);
    setNotes(readNotes());
    return n;
  };
  const copy = async () => {
    const n = save();
    const url = noteUrl(n);
    try { await navigator.clipboard.writeText(url); flash('Saved, and the link is copied. Send it to them.'); }
    catch { window.prompt('Copy this link', url); }
  };
  const share = async () => {
    const n = save();
    try {
      await navigator.share({ title: n.for ? `For ${n.for}` : 'A murmuration', text: 'Some words, written in the sky for you.', url: noteUrl(n) });
    } catch { /* cancelled */ }
  };
  const edit = (n) => { setDraft(n); setDay(weekday()); };
  const remove = (n) => {
    deleteNote(n.id);
    setNotes(readNotes());
    if (draft.id === n.id) setDraft(blank());
  };

  return (
    <section className="mm-panel mm-compose" aria-label="Write it for someone">
      <div className="mm-compose-head">
        <h2>Write it for someone</h2>
        <button type="button" className="mm-x" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="mm-pair">
        <label className="mm-field">
          <span className="mm-label">For</span>
          <input value={draft.for} maxLength={16} placeholder="Their name" onChange={(e) => set({ for: e.target.value })} />
        </label>
        <label className="mm-field">
          <span className="mm-label">From</span>
          <input value={draft.from} maxLength={24} placeholder="Dad" onChange={(e) => set({ from: e.target.value })} />
        </label>
      </div>
      <label className="mm-toggle mm-toggle-s">
        <input type="checkbox" checked={draft.name} onChange={(e) => set({ name: e.target.checked })} />
        <span><strong>Write their name first</strong></span>
      </label>

      <div className="mm-presets" role="group" aria-label="Start from">
        <span className="mm-label">Start from</span>
        {PRESETS.map((p) => (
          <button key={p.key} type="button" className="mm-chip" onClick={() => usePreset(p)} title={p.sub}>{p.title}</button>
        ))}
      </div>

      <div className="mm-row">
        <span className="mm-label">Words</span>
        <div className="mm-seg" role="radiogroup" aria-label="Words">
          <button type="button" role="radio" aria-checked={!week} className={!week ? 'is-on' : ''} onClick={() => setWeek(false)}>Every day</button>
          <button type="button" role="radio" aria-checked={week} className={week ? 'is-on' : ''} onClick={() => setWeek(true)}>A week</button>
        </div>
      </div>

      {week && (
        <div className="mm-days" role="tablist" aria-label="Day">
          {DAY_NAMES.map((n, i) => (
            <button key={n} type="button" role="tab" aria-selected={i === day} aria-label={n}
              className={`${i === day ? 'is-on' : ''}${draft.days[i].words ? ' has' : ''}${i === weekday() ? ' today' : ''}`}
              onClick={() => setDay(i)}>
              {n.slice(0, 2)}
            </button>
          ))}
        </div>
      )}

      <label className="mm-field">
        <span className="mm-label">{week ? `${DAY_NAMES[day]}’s words` : 'The words'}</span>
        <input className="mm-words" value={cur.words} maxLength={70} placeholder="You are loved" onChange={(e) => setEntry({ words: e.target.value })} />
        <span className="mm-hint-s">
          {tooMany ? `Only the first ${MAX_WORDS} words are written.`
            : long.length ? `“${long[0]}” is long: words of ${EASY_LEN} letters or fewer read best on a phone.`
              : 'One to four short words read best. Each is written in turn.'}
        </span>
      </label>
      <label className="mm-field">
        <span className="mm-label">Beneath (optional)</span>
        <textarea rows={2} value={cur.line} maxLength={200} placeholder="A verse, or something to do today" onChange={(e) => setEntry({ line: e.target.value })} />
      </label>
      <label className="mm-field">
        <span className="mm-label">Reference (optional)</span>
        <input value={cur.ref} maxLength={50} placeholder="1 John 4:19" onChange={(e) => setEntry({ ref: e.target.value })} />
      </label>

      <div className="mm-actions">
        <button type="button" className="mm-pill mm-go" disabled={!words.length} onClick={() => onPreview(normaliseNote(draft), d)}>
          Preview{week ? ` ${DAY_NAMES[day].slice(0, 3)}` : ''}
        </button>
        <button type="button" className="mm-pill" disabled={!words.length} onClick={copy}>Save &amp; copy link</button>
        {navigator.share && <button type="button" className="mm-pill" disabled={!words.length} onClick={share}>Share…</button>}
      </div>
      <p className="mm-msg" aria-live="polite">{msg}</p>

      {notes.length > 0 && (
        <div className="mm-notes">
          <span className="mm-label">Kept on this device</span>
          <ul>
            {notes.map((n) => (
              <li key={n.id} className={n.id === draft.id ? 'is-on' : ''}>
                <button type="button" className="mm-note-name" onClick={() => edit(n)}>
                  {n.for || 'Someone'} <span>{n.days.length === 7 ? 'a week' : `“${n.days[0].words}”`}</span>
                </button>
                <button type="button" className="mm-link" onClick={async () => {
                  try { await navigator.clipboard.writeText(noteUrl(n)); flash(`${n.for || 'Their'} link is copied.`); }
                  catch { window.prompt('Copy this link', noteUrl(n)); }
                }}>Copy link</button>
                <button type="button" className="mm-link" onClick={() => remove(n)} aria-label={`Delete ${n.for || 'this note'}`}>Delete</button>
              </li>
            ))}
          </ul>
          <button type="button" className="mm-link" onClick={() => { setDraft(blank()); setDay(weekday()); }}>+ Someone else</button>
        </div>
      )}
      <p className="mm-foot">
        Open the link once on their phone or tablet and it stays there: each day the birds write that day’s words.
      </p>
    </section>
  );
}
