import { useEffect, useState } from 'react';
import SharedStyles from './components/SharedStyles.jsx';
import ViewToggle from './components/ViewToggle.jsx';
import PosterAtmos from './views/PosterAtmos.jsx';
import PosterTextured from './views/PosterTextured.jsx';
import PosterPond from './views/PosterPond.jsx';
import DocumentView from './views/Document.jsx';
import FamilyBoardView from './views/FamilyBoardView.jsx';
import {
  loadBoard,
  MEMBER_INDEX,
  DEFAULT_MEMBER_ID,
} from './data/board.js';

// ═══════════════════════════════════════════════════════════════════
// App — top-level. Loads board content via the async loadBoard()
// adapter (currently local, later Notion) and routes between the
// identity-board views (Atmos / Textured / Pond / Document) and the
// separate Family Board.
//
// View state is persisted in localStorage so the fridge-tablet
// remembers whatever you were last looking at. The default is Pond
// because that's the merge target this project is heading towards.
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_VIEW = 'poster-pond';
const VALID_VIEWS = new Set([
  'poster-atmos',
  'poster-text',
  'poster-pond',
  'document',
  'family',
]);
const VALID_MEMBERS = new Set(MEMBER_INDEX.map((m) => m.id));

export default function App() {
  const [view, setView] = useState(() => {
    try {
      const saved = localStorage.getItem('ib.view');
      if (saved && VALID_VIEWS.has(saved)) return saved;
    } catch {}
    return DEFAULT_VIEW;
  });

  // Which member's board is being rendered. Persisted so the fridge
  // tablet remembers which family member was on screen when it slept.
  const [memberId, setMemberId] = useState(() => {
    try {
      const saved = localStorage.getItem('ib.member');
      if (saved && VALID_MEMBERS.has(saved)) return saved;
    } catch {}
    return DEFAULT_MEMBER_ID;
  });

  const [board, setBoard] = useState(null);

  // Reload the board whenever the selected member changes. `loadBoard`
  // is an async adapter today — local lookups resolve on the next
  // tick, Notion fetches would actually hit the network. Cancel via
  // the effect cleanup so rapid member switches don't race.
  useEffect(() => {
    let cancelled = false;
    loadBoard('local', memberId).then((b) => {
      if (!cancelled) setBoard(b);
    });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  useEffect(() => {
    try {
      localStorage.setItem('ib.view', view);
    } catch {}
  }, [view]);

  useEffect(() => {
    try {
      localStorage.setItem('ib.member', memberId);
    } catch {}
  }, [memberId]);

  // The Family Board manages its own body scrolling; identity-board
  // views scroll the document. Flip overflow accordingly so we don't
  // get double scrollbars on the long editorial views.
  useEffect(() => {
    const isFamily = view === 'family';
    document.documentElement.style.overflow = isFamily ? 'hidden' : 'auto';
    document.body.style.overflow = isFamily ? 'hidden' : 'auto';
    document.body.style.background = isFamily ? '#061915' : '#F1E6D2';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [view]);

  if (!board) {
    // First paint before loadBoard resolves. The local path resolves
    // synchronously on the next tick, so this is essentially a single
    // frame. Kept intentionally bare — no spinner, no chrome.
    return (
      <>
        <SharedStyles />
        <div style={{ minHeight: '100vh', background: '#F1E6D2' }} />
      </>
    );
  }

  const onFamilyBoard = view === 'family';

  return (
    <>
      <SharedStyles />
      <ViewToggle
        view={view}
        setView={setView}
        members={MEMBER_INDEX}
        memberId={memberId}
        setMemberId={setMemberId}
        showMemberPicker={!onFamilyBoard}
      />

      {view === 'poster-atmos' && <PosterAtmos    board={board} />}
      {view === 'poster-text'  && <PosterTextured board={board} />}
      {view === 'poster-pond'  && <PosterPond     board={board} />}
      {view === 'document'     && <DocumentView   board={board} />}
      {view === 'family'       && <FamilyBoardView />}
    </>
  );
}
