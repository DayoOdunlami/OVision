import { useEffect, useMemo, useState } from 'react';
import { LABS, labSaved, setLab, setAllLabs } from '../shared/labs.js';

// ═══════════════════════════════════════════════════════════════════
// Labs — the switchboard for design changes. Each change is listed with
// what's new and what it was; choose New or Classic for this device, or
// look at the two side by side before deciding.
//
// The side-by-side view opens the same page twice: once with only this
// change on (?lab=key) and once with every change off (?labs=classic),
// so the two differ by exactly the one change.
// ═══════════════════════════════════════════════════════════════════

const withQuery = (path, q) => `${path}${path.includes('?') ? '&' : '?'}${q}`;

export default function LabsApp() {
  const [saved, setSaved] = useState(() => Object.fromEntries(LABS.map((l) => [l.key, labSaved(l.key)])));
  const [compare, setCompare] = useState(null);
  const surfaces = useMemo(() => [...new Set(LABS.map((l) => l.surface))], []);

  const choose = (key, on) => {
    setLab(key, on);
    setSaved((s) => ({ ...s, [key]: on }));
  };
  const all = (on, surface) => {
    setAllLabs(on, surface);
    setSaved(Object.fromEntries(LABS.map((l) => [l.key, labSaved(l.key)])));
  };

  return (
    <div className="lb-app">
      <nav className="lb-nav" aria-label="Surfaces">
        <a href="/">Pond</a>
        <a href="/flourish/abide/">Abide</a>
        <a href="/pray/">Pray</a>
      </nav>

      <header className="lb-head">
        <p className="lb-eyebrow">Labs</p>
        <h1>New, or as it was?</h1>
        <p className="lb-lede">
          Every change from a design pass is here, with what it was before. Choose for this
          device, or compare the two side by side. Nothing you’ve made is lost either way.
        </p>
        <div className="lb-all">
          <button type="button" onClick={() => all(true)}>Everything new</button>
          <button type="button" onClick={() => all(false)}>Everything classic</button>
        </div>
      </header>

      {surfaces.map((surface) => (
        <section key={surface} className="lb-surface">
          <div className="lb-surface-head">
            <h2>{surface}</h2>
            <span className="lb-count">
              {LABS.filter((l) => l.surface === surface && saved[l.key]).length} of {LABS.filter((l) => l.surface === surface).length} new
            </span>
          </div>
          <ul className="lb-list">
            {LABS.filter((l) => l.surface === surface).map((l) => (
              <li key={l.key} className="lb-item">
                <div className="lb-text">
                  <h3>{l.title}</h3>
                  <p><span className="lb-tag is-new">New</span>{l.what}</p>
                  <p className="lb-was"><span className="lb-tag">Classic</span>{l.classic}</p>
                </div>
                <div className="lb-controls">
                  <div className="lb-seg" role="radiogroup" aria-label={l.title}>
                    <button type="button" role="radio" aria-checked={saved[l.key]} className={saved[l.key] ? 'is-on' : ''} onClick={() => choose(l.key, true)}>New</button>
                    <button type="button" role="radio" aria-checked={!saved[l.key]} className={!saved[l.key] ? 'is-on' : ''} onClick={() => choose(l.key, false)}>Classic</button>
                  </div>
                  {l.path && (
                    <button type="button" className="lb-compare" onClick={() => setCompare(l)}>Compare side by side</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="lb-foot">
        Tip: add <code>?labs=classic</code> to any page’s address to see it exactly as it was, just
        for that visit.
      </p>

      {compare && <Compare l={compare} onClose={() => setCompare(null)} onChoose={(on) => { choose(compare.key, on); setCompare(null); }} />}
    </div>
  );
}

function Compare({ l, onClose, onChoose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const extra = l.query ? `&${l.query}` : '';
  return (
    <div className="lb-scrim" role="dialog" aria-modal="true" aria-label={`Compare: ${l.title}`}>
      <div className="lb-compare-head">
        <h2>{l.title}</h2>
        <button type="button" className="lb-close" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="lb-frames">
        <figure>
          <figcaption><span className="lb-tag">Classic</span></figcaption>
          <iframe title="Classic" src={withQuery(l.path, 'labs=classic' + extra)} />
          <button type="button" onClick={() => onChoose(false)}>Keep classic</button>
        </figure>
        <figure>
          <figcaption><span className="lb-tag is-new">New</span></figcaption>
          <iframe title="New" src={withQuery(l.path, `lab=${l.key}` + extra)} />
          <button type="button" className="is-primary" onClick={() => onChoose(true)}>Keep new</button>
        </figure>
      </div>
      {l.howTo && <p className="lb-howto">{l.howTo}</p>}
    </div>
  );
}
