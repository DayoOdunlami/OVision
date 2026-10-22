import { go } from '../route.js';
import { THEMES, lowerFirst } from '../board.js';
import { isChild } from '../household.js';
import { KoiGlyph, ThemePicture } from '../ui.jsx';

// ═══════════════════════════════════════════════════════════════════
// Someone's own board (studio P).
//
// The world turns to them: in the pond their koi comes up under their
// word and the others go deep; on the vine, a branch grows out of the
// vine and writes their word. Under it, what the word means to them,
// their one yes, and, for a grown-up, the no they chose: kept here, on
// their own board, and nowhere else (not on the family's board, not on
// the idle screen).
//
// A part of the family's board: their word was one of those the family
// chose its own from.
// ═══════════════════════════════════════════════════════════════════

export default function Person({ day, id }) {
  const board = day.board;
  const p = board?.people.find((x) => x.id === id);
  if (!p) {
    go('home');
    return null;
  }
  const vine = day.world === 'vine';
  const theme = THEMES[p.theme];
  const others = board.people.filter((x) => x.id !== p.id);

  return (
    <main className={'home person-board in-' + day.world} aria-label={`${p.name}’s board`}>
      <header className="home-top">
        <button className="btn btn-quiet back-to" onClick={() => go('home')}>
          <span aria-hidden="true">←</span> Our board
        </button>
      </header>

      <section className="water-words">
        <p className="water-label">{p.name} · a part of {board.word || 'our way'}</p>
        <h1 className={vine ? 'water-word sr-only' : 'water-word'}>{p.word || p.name}</h1>
        <p className="board-meaning">
          <ThemePicture theme={p.theme} size={30} />
          <span>{theme.label}: {theme.hint}</span>
        </p>
        {p.yes && (
          <p className="board-yes">
            <span className="board-today">{isChild(p) ? 'My yes' : 'My yes this season'}</span>
            Yes to {lowerFirst(p.yes)}
          </p>
        )}
        {p.no && !isChild(p) && (
          <p className="board-no">
            So, no to {lowerFirst(p.no)}
            <small>Only on {p.name}’s own board</small>
          </p>
        )}
      </section>

      <nav className="person-strip" aria-label="Everyone’s boards">
        {others.map((o) => (
          <button key={o.id} className="person-chip" onClick={() => go('me', { p: o.id })}>
            <KoiGlyph koi={o.koi} size={26} />
            <span>{o.name}</span>
          </button>
        ))}
        <button className="person-chip" onClick={() => go('season/new', { edit: '1', p: p.id })}>
          <span>Change {p.name}’s board</span>
        </button>
      </nav>
    </main>
  );
}
