import { home } from '../route.js';
import { useDevice, setDevice } from '../store.js';
import { WorldGlyph, CloseButton, tick } from '../ui.jsx';

// ═══════════════════════════════════════════════════════════════════
// The switch: where the board lives on this screen (studio P).
//
// The family chooses the board's world together, at the end of the
// ritual. Any screen can show the other one (the kitchen tablet the
// vine, Dad's phone the pond) and remembers it. The world behind this
// sheet changes as you choose, so you see it before you leave.
// ═══════════════════════════════════════════════════════════════════

export const WORLDS = [
  { id: 'pond', name: 'The pond', line: 'Koi for each of us; our yeses float on lily pads; the word lies in still water.' },
  { id: 'vine', name: 'The vine', line: 'The vine writes our word; each of us is a branch; our yeses hold it up.' },
];

export default function WorldSheet({ day }) {
  const device = useDevice();
  const family = day.season?.world || 'pond';
  const pick = (id) => {
    tick();
    setDevice((d) => ({ ...d, world: id === family ? null : id }));
  };
  return (
    <div className="sheet world-sheet" role="dialog" aria-modal="true" aria-label="Choose the world">
      <div className="sheet-card">
        <div className="sheet-top">
          <h1 className="sheet-title">Where our board lives</h1>
          <CloseButton onClick={home} label="Done" />
        </div>
        <div className="world-tiles" role="radiogroup" aria-label="World">
          {WORLDS.map((w) => {
            const on = day.world === w.id;
            return (
              <button key={w.id} role="radio" aria-checked={on} className={'world-tile' + (on ? ' is-on' : '')} onClick={() => pick(w.id)}>
                <span className="world-tile-mark"><WorldGlyph world={w.id} size={30} /></span>
                <span className="world-tile-name">{w.name}{family === w.id ? <small> · the family’s choice</small> : null}</span>
                <span className="world-tile-line">{w.line}</span>
              </button>
            );
          })}
        </div>
        <p className="sheet-note">
          {device.world && device.world !== family
            ? 'Just on this screen. Everywhere else shows the family’s choice.'
            : 'The family chooses when you set a new season together. Any screen can show the other.'}
        </p>
        <button className="btn btn-primary btn-big" onClick={home}>Done</button>
      </div>
    </div>
  );
}
