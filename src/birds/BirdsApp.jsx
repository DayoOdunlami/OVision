import { lazy, Suspense, useMemo, useState } from 'react';
import { CANDIDATES } from './candidates.js';

// ═══════════════════════════════════════════════════════════════════
// Bird gallery (/birds/) — candidates for the pond's sky, each running
// live, side by side with what we have now. Choose one to start from;
// the notes say where it came from, its licence, what's good about the
// motion, and how we'd use it. Links at the end are for trying on the
// web (CodePen and the like) where the code can't be fetched from here.
// ═══════════════════════════════════════════════════════════════════

const DEMOS = {
  gltf: lazy(() => import('./demos/GltfBirds.jsx')),
  eagle: lazy(() => import('./demos/GltfBirds.jsx').then((m) => ({ default: (p) => <m.default {...p} models={m.EAGLE} /> }))),
  murmuration: lazy(() => import('./demos/Murmuration.jsx')),
};

const pick = () => {
  try { return new URLSearchParams(location.search).get('b'); } catch { return null; }
};

export default function BirdsApp() {
  const live = CANDIDATES.filter((c) => c.kind !== 'link');
  const links = CANDIDATES.filter((c) => c.kind === 'link');
  const [id, setIdRaw] = useState(() => (live.some((c) => c.id === pick()) ? pick() : live[0].id));
  const [menu, setMenu] = useState(false);
  // Notes open on a big screen; on a phone, the birds come first.
  const [info, setInfo] = useState(() => window.innerWidth > 700);
  const c = live.find((x) => x.id === id);
  const [controls, setControls] = useState({});
  const setId = (v) => {
    setIdRaw(v);
    setControls({});
    setMenu(false);
    try { history.replaceState(null, '', `?b=${v}`); } catch { /* ignore */ }
  };
  const Demo = c.kind === 'demo' ? DEMOS[c.demo] : null;
  const set = (k, v) => setControls((s) => ({ ...s, [k]: v }));
  const iframeSrc = useMemo(() => c.kind === 'iframe' ? c.src : null, [c]);

  return (
    <div className="bd-app">
      <div className="bd-view">
        {Demo && (
          <Suspense fallback={<div className="bd-loading">Loading…</div>}>
            <Demo key={c.id} controls={controls} />
          </Suspense>
        )}
        {iframeSrc && <iframe key={c.id} className="bd-frame" title={c.name} src={iframeSrc} />}
      </div>

      <header className="bd-top">
        <a className="bd-back" href="/admin/">← Admin</a>
        <button type="button" className="bd-menu-btn" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
          <span className="bd-count">{live.findIndex((x) => x.id === id) + 1}/{live.length}</span> {c.name} ▾
        </button>
      </header>

      {menu && (
        <nav className="bd-menu" aria-label="Candidates">
          <p className="bd-eyebrow">Running here</p>
          <ul>
            {live.map((x, i) => (
              <li key={x.id}>
                <button type="button" className={x.id === id ? 'is-on' : ''} onClick={() => setId(x.id)}>
                  <span className="bd-n">{i + 1}</span>
                  <span><strong>{x.name}</strong><em>{x.style}</em></span>
                </button>
              </li>
            ))}
          </ul>
          {links.length > 0 && (
            <>
              <p className="bd-eyebrow">To try on the web</p>
              <ul className="bd-links">
                {links.map((x) => (
                  <li key={x.id}>
                    <a href={x.url} target="_blank" rel="noopener noreferrer">
                      <strong>{x.name}</strong><em>{x.style} · {x.license}</em>
                    </a>
                    {x.good && <span className="bd-note">{x.good}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>
      )}

      <section className={`bd-info${info ? '' : ' is-min'}`}>
        <button type="button" className="bd-info-toggle" onClick={() => setInfo((v) => !v)} aria-expanded={info}>
          {info ? 'Hide notes ▾' : 'Notes ▴'}
        </button>
        {info && (
          <>
            <h1>{c.name}</h1>
            <p className="bd-style">{c.style}</p>
            <dl>
              <dt>What’s good</dt><dd>{c.good}</dd>
              <dt>How we’d use it</dt><dd>{c.use}</dd>
              <dt>Source</dt><dd>{c.sourceUrl ? <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">{c.source}</a> : c.source}</dd>
              <dt>Licence</dt><dd>{c.license}</dd>
            </dl>
            {c.controls && (
              <div className="bd-controls">
                {c.controls.map((k) => <Control key={k.id} k={k} value={controls[k.id]} set={set} />)}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function Control({ k, value, set }) {
  if (k.type === 'range') {
    const v = value ?? k.default;
    return (
      <label className="bd-ctl">
        <span>{k.label} <b>{Number(v).toFixed(k.step < 1 ? 1 : 0)}</b></span>
        <input type="range" min={k.min} max={k.max} step={k.step} value={v} onChange={(e) => set(k.id, Number(e.target.value))} />
      </label>
    );
  }
  const v = value ?? k.default;
  return (
    <div className="bd-ctl">
      <span>{k.label}</span>
      <div className="bd-seg">
        {k.options.map(([id, label]) => (
          <button key={id} type="button" className={v === id ? 'is-on' : ''} onClick={() => set(k.id, id)}>{label}</button>
        ))}
      </div>
    </div>
  );
}
