import { loadBoard, DEFAULT_MEMBER_ID } from '../data/board.js';
import { decodeBoard } from '../data/customBoards.js';

// ═══════════════════════════════════════════════════════════════════
// The words the flock writes, from the viewer's board, and how a word
// becomes a set of places for birds to be.
// ═══════════════════════════════════════════════════════════════════

const clean = (s) => (typeof s === 'string' ? s.trim() : '');

// The board: a shared link (?board=), else the one the pond is showing.
export async function boardWords() {
  let board = null;
  try {
    const code = new URLSearchParams(location.search).get('board');
    if (code) board = decodeBoard(code);
  } catch { /* ignore */ }
  if (!board) {
    let id = DEFAULT_MEMBER_ID;
    try { id = localStorage.getItem('ib.member') || id; } catch { /* ignore */ }
    board = await loadBoard('local', id);
  }
  const words = [];
  const add = (text, weight, verse, ref) => {
    const t = clean(text);
    if (!t || t.length > 14 || words.some((w) => w.text.toLowerCase() === t.toLowerCase())) return;
    words.push({ text: t, weight, verse: clean(verse), ref: clean(ref) });
  };
  const id = board?.identity || {}, season = board?.season || {}, fr = board?.friction || {};
  // The identity word is home: it comes most often, with its verse.
  add(id.heroWord, 3, id.anchor?.text, id.anchor?.reference);
  add(season.heroWord, 2, season.sentence);
  add(fr.heroWord, 1.5, fr.prayer?.text, fr.prayer?.reference);
  for (const v of id.values || []) add(v, 1);
  for (const c of board?.commitments || []) add(c.verb, 0.6);
  if (!words.length) add('Abide', 1, 'Abide in me, and I in you.', 'John 15:4');
  return { words, owner: board?.owner || board?.name || '', period: board?.period || '' };
}

// Pick the next word by weight, never the same twice in a row.
// On a narrow screen long words turn to dust, so they come less often.
export function pickWord(words, last, mode, narrow = false) {
  if (mode === 'one') return words[0];
  const pool = words.length > 1 ? words.filter((w) => w !== last) : words;
  const weight = (w) => w.weight * (narrow && w.text.length > 8 ? 0.25 : 1);
  let r = Math.random() * pool.reduce((m, w) => m + weight(w), 0);
  for (const w of pool) { r -= weight(w); if (r <= 0) return w; }
  return pool[0];
}

// Draw the word off screen and sample it into n points, in world units
// relative to the word's centre, fitted within maxW × maxH. About a
// third come from the outline (crisp letterforms), the rest from inside.
// lettering: 'sans' (heavy, upright, even strokes: reads best in birds)
// or 'serif' (the pond's italic display face).
export function sampleWord(text, n, maxW, maxH, lettering = 'sans') {
  const S = 220;                                  // drawing size, px
  const c = document.createElement('canvas');
  const x = c.getContext('2d', { willReadFrequently: true });
  const spec = lettering === 'serif'
    ? `italic 800 ${S}px "Fraunces", Georgia, serif`
    : `700 ${S}px "Manrope", "Source Sans 3", system-ui, sans-serif`;
  x.font = spec;
  // Letters drawn one by one with air between them, so neighbouring
  // letters made of birds don't run together.
  const gap = S * 0.1;
  const chars = [...text];
  const widths = chars.map((ch) => x.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (chars.length - 1);
  const w = Math.ceil(total + S * 0.3), h = Math.ceil(S * 1.35);
  c.width = w; c.height = h;
  x.font = spec;
  x.fillStyle = '#000';
  x.strokeStyle = '#000';
  x.textBaseline = 'middle';
  // A little stroke as well as the fill, so an italic's hairlines are
  // thick enough for birds to hold.
  x.lineWidth = lettering === 'serif' ? S * 0.05 : S * 0.02;
  x.lineJoin = 'round';
  let cx0 = S * 0.15;
  chars.forEach((ch, i) => {
    x.strokeText(ch, cx0, h * 0.52);
    x.fillText(ch, cx0, h * 0.52);
    cx0 += widths[i] + gap;
  });
  const data = x.getImageData(0, 0, w, h).data;
  const on = (px, py) => px >= 0 && py >= 0 && px < w && py < h && data[(py * w + px) * 4 + 3] > 128;
  // Tight bounds of the ink.
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  const inside = [], edge = [];
  for (let py = 0; py < h; py += 2) {
    for (let px = 0; px < w; px += 2) {
      if (!on(px, py)) continue;
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
      const border = !on(px - 3, py) || !on(px + 3, py) || !on(px, py - 3) || !on(px, py + 3);
      (border ? edge : inside).push([px, py]);
    }
  }
  if (!inside.length && !edge.length) return [];
  const k = Math.min(maxW / Math.max(1, x1 - x0), maxH / Math.max(1, y1 - y0));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const take = (arr, count) => {
    const out = [];
    for (let i = 0; i < count; i++) out.push(arr[Math.floor(Math.random() * arr.length)]);
    return out;
  };
  const nEdge = Math.min(edge.length ? Math.round(n * 0.42) : 0, n);
  const pts = [...take(edge, nEdge), ...take(inside.length ? inside : edge, n - nEdge)];
  // The drawing itself, and how it maps to the points, so the page can
  // lay a faint guide of the letters exactly under the birds.
  const out = pts.map(([px, py]) => [
    (px - cx + (Math.random() - 0.5) * 2) * k,
    -(py - cy + (Math.random() - 0.5) * 2) * k,
    (Math.random() - 0.5) * 6,
  ]);
  out.guide = { canvas: c, k, cx, cy };
  return out;
}
