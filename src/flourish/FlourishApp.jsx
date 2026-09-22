import { useEffect, useState } from 'react';
import WordVine from './components/WordVine.jsx';

// ═══════════════════════════════════════════════════════════════════
// Flourish — the third surface, beside the Pond and Pray.
//
// "I am the vine; you are the branches." (John 15:5)
//
// For now: one word, written by a growing vine. It's the first piece of
// a living family vine, where branches grow toward goals and leaves
// come from days prayed. Any word can be tried from the foot of the
// page; it's kept in the address (?w=…) so it can be shared.
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_WORD = 'Abide';
const MAX_LEN = 12;

const clean = (w) => (w || '').replace(/[^A-Za-z '.!?&-]/g, '').trim().slice(0, MAX_LEN);

function wordFromUrl() {
  try {
    return clean(new URLSearchParams(location.search).get('w')) || DEFAULT_WORD;
  } catch {
    return DEFAULT_WORD;
  }
}

export default function FlourishApp() {
  const [word, setWord] = useState(wordFromUrl);
  const [draft, setDraft] = useState('');
  const [play, setPlay] = useState(0);
  const [grown, setGrown] = useState(false);

  useEffect(() => { setGrown(false); }, [word, play]);

  useEffect(() => {
    try {
      const u = new URL(location.href);
      if (word === DEFAULT_WORD) u.searchParams.delete('w');
      else u.searchParams.set('w', word);
      history.replaceState(null, '', u);
    } catch { /* ignore */ }
  }, [word]);

  const submit = (e) => {
    e.preventDefault();
    const w = clean(draft);
    if (!w) return;
    setDraft('');
    if (w === word) setPlay((n) => n + 1);
    else setWord(w);
  };

  const isAbide = word.toLowerCase() === 'abide';

  return (
    <div className="fl-app">
      <nav className="fl-nav" aria-label="Surfaces">
        <a href="/" className="fl-pill">Pond</a>
        <span className="fl-pill is-here" aria-current="page">Flourish</span>
        <a href="/pray/" className="fl-pill">Pray</a>
      </nav>

      <main className="fl-stage">
        <WordVine word={word} playKey={play} onGrown={() => setGrown(true)} />
        <p className={`fl-verse${grown ? ' is-shown' : ''}`}>
          {isAbide ? (
            <>
              <span className="fl-verse-text">“Abide in me, and I in you.”</span>
              <span className="fl-verse-ref">John 15:4</span>
            </>
          ) : (
            <>
              <span className="fl-verse-text">“I am the vine; you are the branches.”</span>
              <span className="fl-verse-ref">John 15:5</span>
            </>
          )}
        </p>
      </main>

      <footer className="fl-foot">
        <button type="button" className="fl-btn" onClick={() => setPlay((n) => n + 1)}>
          Grow again
        </button>
        <form className="fl-try" onSubmit={submit}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_LEN}
            placeholder="Try a word"
            aria-label="Try a word"
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit" className="fl-btn" disabled={!clean(draft)}>Grow</button>
        </form>
      </footer>
    </div>
  );
}
