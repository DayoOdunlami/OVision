import { useEffect, useState } from 'react';
import SharedStyles from './components/SharedStyles.jsx';
import ViewToggle from './components/ViewToggle.jsx';
import PosterPond from './views/PosterPond.jsx';
import DocumentView from './views/Document.jsx';
import {
  loadBoard,
  allMemberIndex,
  DEFAULT_MEMBER_ID,
} from './data/board.js';
import { decodeBoard, saveCustomBoard } from './data/customBoards.js';

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
const query = (k) => { try { return new URLSearchParams(location.search).get(k); } catch { return null; } };
// A board that arrived as a link (?board=…): shown at once, kept on
// this device only if the person asks.
const SHARED = query('board') ? decodeBoard(query('board')) : null;
// ?preview=1: the /make/ page's live preview — just the board.
const PREVIEW = query('preview') === '1';

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
  const [members, setMembers] = useState(allMemberIndex);
  const [shared, setShared] = useState(SHARED);
  const [memberId, setMemberId] = useState(() => {
    const valid = new Set(allMemberIndex().map((m) => m.id));
    const asked = query('member');
    if (asked && valid.has(asked)) return asked;
    try {
      const saved = localStorage.getItem('ib.member');
      if (saved && valid.has(saved)) return saved;
    } catch {}
    return DEFAULT_MEMBER_ID;
  });
  const keepShared = () => {
    const b = saveCustomBoard(shared);
    setMembers(allMemberIndex());
    setShared(null);
    setMemberId(b.id);
    history.replaceState(null, '', '/');
  };
  const closeShared = () => {
    setShared(null);
    history.replaceState(null, '', '/');
  };

  const [board, setBoard] = useState(null);

  // Reload the board whenever the selected member changes. `loadBoard`
  // is an async adapter today — local lookups resolve on the next
  // tick, Notion fetches would actually hit the network. Cancel via
  // the effect cleanup so rapid member switches don't race.
  useEffect(() => {
    let cancelled = false;
    if (shared) { setBoard(shared); return undefined; }
    loadBoard('local', memberId).then((b) => {
      if (!cancelled) setBoard(b);
    });
    return () => {
      cancelled = true;
    };
  }, [memberId, shared]);

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
      {!PREVIEW && <ViewToggle
        view={view}
        setView={setView}
        members={shared ? [...members, { id: shared.id, name: shared.name, role: 'Shared with you' }] : members}
        memberId={shared ? shared.id : memberId}
        setMemberId={(id) => { if (shared) closeShared(); setMemberId(id); }}
      />}

      {shared && !PREVIEW && (
        <div className="shared-banner sans" role="region" aria-label="A board shared with you">
          <span>Someone shared <strong>{shared.name}</strong>’s board with you.</span>
          <button type="button" onClick={keepShared}>Keep it on this device</button>
          <button type="button" className="is-quiet" onClick={closeShared}>Just looking</button>
        </div>
      )}
      {view === 'poster-pond' && <PosterPond key={board.id} board={board} />}
      {view === 'document'    && <DocumentView board={board} />}
    </>
  );
}
