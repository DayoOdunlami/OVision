import { useState } from 'react';
import LabsApp from '../labs/LabsApp.jsx';
import { LABS } from '../shared/labs.js';

// ═══════════════════════════════════════════════════════════════════
// Admin — the developer side, opened from the main app (Pond settings →
// Admin, or /admin/). Not security, just a latch so the family doesn't
// wander in: the password is "bio123" (or "123", or "dayo123").
//
// One place to see which version is live, flip the whole app between
// Main (as it was) and Lab (every new change), choose change by change
// (Labs, below), and jump to every surface and mode.
// ═══════════════════════════════════════════════════════════════════

const OK_KEY = 'admin.ok';
const HOME_KEY = 'vb.home';
const PASSWORDS = ['bio123', '123', 'dayo123'];
const LIVE = 'https://o-vision.vercel.app';

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* ignore */ } };

export default function AdminApp() {
  const [ok, setOk] = useState(() => read(OK_KEY) === '1');
  if (!ok) return <Gate onOpen={() => { write(OK_KEY, '1'); setOk(true); }} />;
  return <LabsApp renderHeader={(api) => <Header {...api} onLock={() => { write(OK_KEY, null); setOk(false); }} />} />;
}

function Gate({ onOpen }) {
  const [pw, setPw] = useState('');
  const [wrong, setWrong] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    if (PASSWORDS.includes(pw.toLowerCase().replace(/[\s.]/g, ''))) onOpen();
    else { setWrong(true); setPw(''); }
  };
  return (
    <div className="lb-app ad-gate">
      <nav className="lb-nav"><a href="/">← Back to the pond</a></nav>
      <form className="ad-gate-form" onSubmit={submit}>
        <p className="lb-eyebrow">Admin</p>
        <h1>For grown-ups</h1>
        <label>
          <span className="ad-label">Password</span>
          <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setWrong(false); }} autoFocus autoComplete="off" />
        </label>
        {wrong && <p className="ad-wrong">Not quite.</p>}
        <button type="submit" className="ad-primary">Open</button>
      </form>
    </div>
  );
}

function Header({ all, saved, onLock }) {
  const on = LABS.filter((l) => saved[l.key]).length;
  const mode = on === LABS.length ? 'lab' : on === 0 ? 'main' : 'mixed';
  const [home, setHomeRaw] = useState(() => read(HOME_KEY) === 'today');
  const setHome = (v) => { setHomeRaw(v); write(HOME_KEY, v ? 'today' : null); };
  const here = location.origin;
  const isLive = here === LIVE;

  return (
    <>
      <nav className="lb-nav" aria-label="Surfaces">
        <a href="/">Pond</a>
        <a href="/pray/">Pray</a>
        <a href="/flourish/abide/">Abide</a>
        <a href="/today/">Today</a>
        <button type="button" className="ad-lock" onClick={onLock}>Lock</button>
      </nav>

      <header className="lb-head">
        <p className="lb-eyebrow">Admin</p>
        <h1>Main, or Lab?</h1>
        <p className="lb-lede">
          <strong>Main</strong> is the app as it was before the design passes. <strong>Lab</strong> turns on
          every new change. Or choose change by change below. It’s per device, and nothing the family has
          made is touched either way.
        </p>
        <div className="ad-mode" role="radiogroup" aria-label="Main or Lab">
          <button type="button" role="radio" aria-checked={mode === 'main'} className={mode === 'main' ? 'is-on' : ''} onClick={() => all(false)}>Main</button>
          <button type="button" role="radio" aria-checked={mode === 'lab'} className={mode === 'lab' ? 'is-on' : ''} onClick={() => all(true)}>Lab</button>
        </div>
        <p className="ad-now">
          {mode === 'mixed' ? `Mixed: ${on} of ${LABS.length} changes on.` : mode === 'lab' ? 'Every change is on.' : 'Everything as it was.'}
        </p>
      </header>

      <section className="ad-cards">
        <div className="ad-card">
          <h2>Where it lives</h2>
          <p>
            Live at <a href={LIVE}>o-vision.vercel.app</a>. Every change pushed to <code>main</code> on GitHub
            appears there in about a minute (Vercel project <em>o-vision</em>).
          </p>
          <p className="ad-meta">
            This page: <code>{here}</code>{isLive ? ' (the live site)' : ''} · version <code>{__BUILD_ID__}</code>
          </p>
        </div>

        <div className="ad-card">
          <h2>Open</h2>
          <ul className="ad-links">
            <li><a href="/">Pond</a></li>
            <li><a href="/?world=birds">Pond as birds at dusk</a></li>
            <li><a href="/?world=dusk3d">Pond as dusk in 3D (preview)</a></li>
            <li><a href="/?screen=1">Pond as a screensaver</a></li>
            <li><a href="/pray/">Pray</a></li>
            <li><a href="/flourish/abide/">Abide</a></li>
            <li><a href="/today/">Today</a></li>
            <li><a href="/make/">Make a board</a></li>
            <li><a href="/birds/">Bird gallery (candidates)</a></li>
          </ul>
        </div>

        <div className="ad-card">
          <h2>Start the day on Today</h2>
          <p>Opening the pond on this device goes to Today first (once a session). Each surface still works on its own.</p>
          <label className="ad-switch">
            <input type="checkbox" checked={home} onChange={(e) => setHome(e.target.checked)} />
            <span>{home ? 'On' : 'Off'}</span>
          </label>
        </div>
      </section>

      <h2 className="ad-section">Change by change</h2>
    </>
  );
}
