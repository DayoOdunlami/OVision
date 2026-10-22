import { useState } from 'react';
import { home } from '../route.js';
import { setState, getState } from '../store.js';
import { person, nextKoi, uid, KOI_ORDER } from '../household.js';
import { CloseButton, KoiGlyph } from '../ui.jsx';

// ═══════════════════════════════════════════════════════════════════
// Setup — who lives here. Names, grown-up or child, and a koi each
// (tap the koi to choose another). That's all: the rota, the prayer and
// the pond work it out from there. Words for the season can wait.
// ═══════════════════════════════════════════════════════════════════

export default function Setup() {
  const existing = getState().household;
  const [people, setPeople] = useState(() => existing?.people?.length
    ? existing.people
    : [person('', 'adult', 'chagoi'), person('', 'child', 'kohaku')]);

  const update = (id, patch) => setPeople((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const add = () => setPeople((ps) => [...ps, person('', 'child', nextKoi(ps))]);
  const remove = (id) => setPeople((ps) => ps.filter((p) => p.id !== id));
  const cycle = (p) => update(p.id, { koi: KOI_ORDER[(KOI_ORDER.indexOf(p.koi) + 1) % KOI_ORDER.length] });

  const named = people.filter((p) => p.name.trim());
  const save = () => {
    const clean = named.map((p) => ({ ...p, name: p.name.trim(), short: (p.short || '').trim() }));
    setState((s) => ({ ...s, household: { id: s.household?.id || uid(), name: s.household?.name || '', people: clean } }));
    home();
  };

  return (
    <div className="room room-paper setup" role="dialog" aria-modal="true" aria-label="Who lives here">
      <div className="room-top"><span />{existing && <CloseButton onClick={home} />}</div>
      <div className="room-body scroll">
        <p className="label">{existing ? 'Our household' : 'Set up'}</p>
        <h1 className="room-title">Who lives here?</h1>
        <p className="room-sub">Each of you gets a koi in the pond. Tap a koi to choose another.</p>
        <ul className="people-edit">
          {people.map((p, k) => (
            <li key={p.id}>
              <button className="koi-pick" onClick={() => cycle(p)} aria-label={`Change ${p.name || 'this person'}'s koi`}>
                <KoiGlyph koi={p.koi} size={40} />
              </button>
              <div className="pe-fields">
                <input
                  className="field"
                  placeholder={k === 0 ? 'Name (you)' : 'Name'}
                  value={p.name}
                  onChange={(e) => update(p.id, { name: e.target.value.slice(0, 24) })}
                  aria-label="Name"
                  autoFocus={k === 0 && !p.name}
                />
                <div className="pe-row">
                  <div className="seg small" role="radiogroup" aria-label="Grown-up or child">
                    {['adult', 'child'].map((kind) => (
                      <button key={kind} role="radio" aria-checked={p.kind === kind} className={'seg-opt' + (p.kind === kind ? ' is-on' : '')} onClick={() => update(p.id, { kind })}>
                        {kind === 'adult' ? 'Grown-up' : 'Child'}
                      </button>
                    ))}
                  </div>
                  {p.kind === 'adult' && (
                    <input
                      className="field small"
                      placeholder="Called, e.g. Dad"
                      value={p.short || ''}
                      onChange={(e) => update(p.id, { short: e.target.value.slice(0, 16) })}
                      aria-label="What the children call them"
                    />
                  )}
                </div>
              </div>
              {people.length > 1 && (
                <button className="link remove" onClick={() => remove(p.id)} aria-label={`Remove ${p.name || 'this person'}`}>Remove</button>
              )}
            </li>
          ))}
        </ul>
        <button className="btn btn-secondary" onClick={add}>Add someone</button>
      </div>
      <div className="room-foot">
        {existing ? <span className="foot-note">{named.length} {named.length === 1 ? 'person' : 'people'}</span> : <button className="btn btn-quiet" onClick={home}>Back</button>}
        <button className="btn btn-primary btn-big" disabled={!named.length} onClick={save}>{existing ? 'Save' : 'Done'}</button>
      </div>
    </div>
  );
}
