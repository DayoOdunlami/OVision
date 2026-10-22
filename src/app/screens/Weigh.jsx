import { go, home } from '../route.js';
import { lowerFirst } from '../board.js';
import { CloseButton } from '../ui.jsx';

// ═══════════════════════════════════════════════════════════════════
// Weighing a decision (studio P).
//
// The board turned into three questions to hold something up to: a
// party invitation, a new club, a job, a weekend. It asks; it doesn't
// answer, keep anything, or give a verdict anyone could use against
// anyone. The last question is the one discernment really asks.
// ═══════════════════════════════════════════════════════════════════

export default function Weigh({ day }) {
  const board = day.board;
  if (!board) { go('home'); return null; }
  const yes = board.yes.map((y) => lowerFirst(y.text));
  return (
    <div className="room room-paper weigh" role="dialog" aria-modal="true" aria-label="Weighing a decision">
      <div className="room-top"><span /><CloseButton onClick={home} label="Back to our board" /></div>
      <div className="room-body scroll centred-col">
        <p className="label">Weighing a decision?</p>
        <h1 className="room-title">Hold it up to our way.</h1>
        <ol className="weigh-list">
          <li>
            <b>Does it help us be {board.word}?</b>
            {board.line && <span>{board.line}</span>}
          </li>
          {yes.length > 0 && (
            <li>
              <b>Does it make room for one of our yeses?</b>
              <span>{yes.join(' · ')}</span>
            </li>
          )}
          <li>
            <b>Which way leaves us more loving, and more at peace?</b>
            <span>Talk it over. There’s no need to decide here.</span>
          </li>
        </ol>
        <p className="room-sub">Nothing here is kept.</p>
        <div className="season-actions">
          <button className="btn btn-primary" onClick={() => go('pray')}>Pray about it</button>
          <button className="btn btn-secondary" onClick={home}>Back to our board</button>
        </div>
      </div>
    </div>
  );
}
