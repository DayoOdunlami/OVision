import { FAMILY, DEFAULT_SELF } from '../../shared/family.js';
import { KOI_BY_PERSON } from '../../data/prayerLink.js';

// ═══════════════════════════════════════════════════════════════════
// Who's abiding. The family shares one device, and often two or three
// of them pray or clear the field together — so a session belongs to a
// group, picked with a tap at the start and remembered for next time.
// Each person is shown by their koi's colour, which the children
// already know as theirs from the pond.
// ═══════════════════════════════════════════════════════════════════

const KOI_COLOR = {
  chagoi: '#a8743f',
  kohaku: '#d8432c',
  sanke: '#e4dccd',
  ogon: '#e2b23a',
  asagi: '#5b7fa6',
  showa: '#2d2a28',
};

export const PEOPLE = FAMILY.map((p) => ({
  name: p.name,
  label: p.label,
  color: KOI_COLOR[KOI_BY_PERSON[p.name]] || '#9cb93a',
}));

export const personOf = (name) => PEOPLE.find((p) => p.name === name) || null;

const KEY = 'abide.who';
export function readGroup() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (Array.isArray(v)) {
      const ok = v.filter((n) => PEOPLE.some((p) => p.name === n));
      if (ok.length) return ok;
    }
  } catch { /* ignore */ }
  try {
    const self = JSON.parse(localStorage.getItem('familyPrayer') || 'null')?.selfName;
    if (PEOPLE.some((p) => p.name === self)) return [self];
  } catch { /* ignore */ }
  return [DEFAULT_SELF];
}
export function writeGroup(names) {
  try { localStorage.setItem(KEY, JSON.stringify(names)); } catch { /* ignore */ }
}

// "Dad", "Dad & Bella", "Dad, Bella & Ezra"
export function groupLabel(names) {
  const labels = names.map((n) => personOf(n)?.label || n);
  if (labels.length <= 1) return labels[0] || 'The family';
  return `${labels.slice(0, -1).join(', ')} & ${labels[labels.length - 1]}`;
}
