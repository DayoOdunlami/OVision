import { useEffect, useState } from 'react';
import SharedStyles from './components/SharedStyles.jsx';
import ViewToggle from './components/ViewToggle.jsx';
import PosterAtmos from './views/PosterAtmos.jsx';
import PosterTextured from './views/PosterTextured.jsx';
import PosterPond from './views/PosterPond.jsx';
import DocumentView from './views/Document.jsx';
import FamilyBoardView from './views/FamilyBoardView.jsx';
import { loadBoard } from './data/board.js';

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

export default function App() {
  const [view, setView] = useState(() => {
    try {
      const saved = localStorage.getItem('ib.view');
      if (saved && VALID_VIEWS.has(saved)) return saved;
    } catch {}
    return DEFAULT_VIEW;
  });

  const [board, setBoard] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadBoard('local').then((b) => {
      if (!cancelled) setBoard(b);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ib.view', view);
    } catch {}
  }, [view]);

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

  return (
    <>
      <SharedStyles />
      <ViewToggle view={view} setView={setView} />

      {view === 'poster-atmos' && <PosterAtmos    board={board} />}
      {view === 'poster-text'  && <PosterTextured board={board} />}
      {view === 'poster-pond'  && <PosterPond     board={board} />}
      {view === 'document'     && <DocumentView   board={board} />}
      {view === 'family'       && <FamilyBoardView />}
    </>
  );
}
