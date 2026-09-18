import { useEffect, useState } from 'react';
import SharedStyles from './components/SharedStyles.jsx';
import ViewToggle from './components/ViewToggle.jsx';
import PosterPond from './views/PosterPond.jsx';
import DocumentView from './views/Document.jsx';
import {
  loadBoard,
  MEMBER_INDEX,
  DEFAULT_MEMBER_ID,
} from './data/board.js';

// ═══════════════════════════════════════════════════════════════════
// App — top-level for the Pond surface.
//
// There are two surfaces in this project and only one of them is a
// React app:
//
//   /       → this. The Pond: ambient, peripheral, always-on. Lives on
//             the fridge tablet and is meant to be glanced at.
//   /pray/  → a self-contained static page. Focal, sequential, one
//             line at a time. Deliberately NOT a pond view, because
//             animated koi behind prayer text would fight the exact
//             problem that surface exists to solve.
//
// The two share one localStorage (same origin) — see data/prayerLink.js.
//
// Within the Pond surface there are two views: the pond itself, and
// Document, which is the full-text fallback for everything the pond
// deliberately leaves out. Atmosphere / Textured / Family were retired.
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_VIEW = 'poster-pond';
const VALID_VIEWS = new Set(['poster-pond', 'document']);
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

  // The pond is deep water edge-to-edge; Document is warm paper. Set
  // the body background to match so iOS overscroll rubber-banding
  // reveals more water / more paper rather than a cream seam under the
  // pond. index.html ships the paper colour as the pre-hydration
  // default, so only the pond needs an override.
  useEffect(() => {
    const onPond = view === 'poster-pond';
    document.body.style.background = onPond ? '#0b2a2e' : '#F1E6D2';
    document.documentElement.style.background = onPond ? '#0b2a2e' : '#F1E6D2';
    return () => {
      document.body.style.background = '';
      document.documentElement.style.background = '';
    };
  }, [view]);

  if (!board) {
    // First paint before loadBoard resolves. The local path resolves
    // synchronously on the next tick, so this is essentially a single
    // frame. Kept intentionally bare — no spinner, no chrome.
    return (
      <>
        <SharedStyles />
        <div style={{ minHeight: '100vh', background: '#0b2a2e' }} />
      </>
    );
  }

  return (
    <>
      <SharedStyles />
      <ViewToggle
        view={view}
        setView={setView}
        members={MEMBER_INDEX}
        memberId={memberId}
        setMemberId={setMemberId}
      />

      {view === 'poster-pond' && <PosterPond   board={board} />}
      {view === 'document'    && <DocumentView board={board} />}
    </>
  );
}
