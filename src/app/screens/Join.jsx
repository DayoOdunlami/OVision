import { readJoin } from '../household.js';
import { getState, replaceAll, EMPTY, isDemo } from '../store.js';
import { KoiGlyph } from '../ui.jsx';

// ═══════════════════════════════════════════════════════════════════
// Join — a household carried over from another device by a link. The
// rota is worked out from the household itself, so once both devices
// have it they agree on today's prayer with no sync.
// ═══════════════════════════════════════════════════════════════════

export default function Join({ raw }) {
  const got = readJoin(raw);
  const mine = getState().household;
  const leave = () => window.location.replace('/');

  if (!got || isDemo) {
    return (
      <div className="room room-paper" role="dialog" aria-modal="true">
        <div className="room-body centred">
          <h1 className="room-title">That link didn’t work.</h1>
          <p className="room-sub">Ask for a new one from the other device: Settings, then “Another phone or tablet”.</p>
          <button className="btn btn-primary btn-big" onClick={leave}>Go to the pond</button>
        </div>
      </div>
    );
  }

  const use = () => {
    const keep = mine && mine.id === got.household.id ? getState() : EMPTY;
    replaceAll({
      ...keep,
      household: got.household,
      seasons: got.season ? [...keep.seasons.filter((s) => s.id !== got.season.id && s.end), got.season] : keep.seasons,
    });
    leave();
  };

  return (
    <div className="room room-paper" role="dialog" aria-modal="true" aria-label="Join a household">
      <div className="room-body centred">
        <p className="label">From another device</p>
        <h1 className="room-title">Use this household here?</h1>
        <div className="here-names many">
          {got.household.people.map((p) => (
            <span key={p.id} className="here-name"><KoiGlyph koi={p.koi} size={40} /><b>{p.name}</b></span>
          ))}
        </div>
        {got.season && <p className="room-sub">This season’s word: <b>{got.season.family?.word}</b></p>}
        {mine && mine.id !== got.household.id && (
          <p className="room-sub warn">This device already has a household. Using this one replaces it here.</p>
        )}
        <div className="welcome-actions">
          <button className="btn btn-primary btn-big" onClick={use}>Use it on this device</button>
          <button className="btn btn-secondary btn-big" onClick={leave}>Not now</button>
        </div>
      </div>
    </div>
  );
}
