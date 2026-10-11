// ═══════════════════════════════════════════════════════════════════
// Boards anyone can make (at /make/), kept on this device under
// `vb.boards`, and passed between people as a link:
//
//   /?board=<board, as base64url JSON>   opens it; "Keep it" saves it
//
// No server: the link *is* the board. A board has the same shape as the
// built-in ones in board.js (identity / season / commitments / friction)
// (Boards made while there were other worlds may still carry `world`;
// it's dropped.)
// ═══════════════════════════════════════════════════════════════════

const KEY = 'vb.boards';

const str = (v, max = 400) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const words = (v, n, max = 40) => (Array.isArray(v) ? v : []).map((x) => str(x, max)).filter(Boolean).slice(0, n);

// Whatever arrives (typed, stored, or from a link), make it a safe,
// complete board. Text only; nothing is ever rendered as HTML.
export function normaliseBoard(b = {}) {
  const id = /^custom-[a-z0-9-]{1,40}$/.test(b.id || '') ? b.id : `custom-${Math.random().toString(36).slice(2, 9)}`;
  const name = str(b.name, 40) || 'My board';
  const threads = (Array.isArray(b.season?.threads) ? b.season.threads : [])
    .map((t) => ({ label: str(t?.label, 30), note: str(t?.note, 60) }))
    .filter((t) => t.label || t.note)
    .slice(0, 3);
  const commitments = (Array.isArray(b.commitments) ? b.commitments : [])
    .map((c) => ({ verb: str(c?.verb, 16), text: str(c?.text, 140), cadence: str(c?.cadence, 16), tag: str(c?.tag, 16) }))
    .filter((c) => c.verb || c.text)
    .slice(0, 4);
  return {
    id,
    custom: true,
    name,
    role: 'Made here',
    owner: str(b.owner, 40) || name,
    period: str(b.period, 40),
    identity: {
      statement: str(b.identity?.statement, 280),
      heroWord: str(b.identity?.heroWord, 18) || 'Becoming',
      values: words(b.identity?.values, 3, 24),
      anchor: { text: str(b.identity?.anchor?.text, 200), reference: str(b.identity?.anchor?.reference, 40) },
    },
    season: {
      heroWord: str(b.season?.heroWord, 18) || 'Now',
      sentence: str(b.season?.sentence, 240),
      threads,
    },
    commitments,
    friction: {
      sentence: str(b.friction?.sentence, 200),
      heroWord: str(b.friction?.heroWord, 18) || 'deeper',
      cadence: str(b.friction?.cadence, 60),
      plans: [],
      prayer: { text: str(b.friction?.prayer?.text, 240), reference: str(b.friction?.prayer?.reference, 40) },
      walking: str(b.friction?.walking, 240),
    },
  };
}

export function readCustomBoards() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.map(normaliseBoard) : [];
  } catch { return []; }
}

export function saveCustomBoard(board) {
  const b = normaliseBoard(board);
  const all = readCustomBoards().filter((x) => x.id !== b.id);
  all.push(b);
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return b;
}

export function deleteCustomBoard(id) {
  const all = readCustomBoards().filter((x) => x.id !== id);
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* ignore */ }
}

// ── Links ──────────────────────────────────────────────────────────
// Only the board's words travel (not its id), so a shared board is a
// copy: the person who receives it can make it their own.
export function encodeBoard(board) {
  const { id, custom, role, ...rest } = normaliseBoard(board);   // eslint-disable-line no-unused-vars
  const bytes = new TextEncoder().encode(JSON.stringify(rest));
  let bin = '';
  bytes.forEach((c) => { bin += String.fromCharCode(c); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeBoard(code) {
  try {
    const b64 = String(code).replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const v = JSON.parse(new TextDecoder().decode(bytes));
    return v && typeof v === 'object' ? normaliseBoard(v) : null;
  } catch { return null; }
}

export function shareUrl(board) {
  return `${location.origin}/?board=${encodeBoard(board)}`;
}
