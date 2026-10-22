// ═══════════════════════════════════════════════════════════════════
// household.js — who lives here, and each person's koi.
//
// A household is any number of people, each a grown-up or a child,
// each with a koi variety (their colour everywhere in the app). Nothing
// here knows about any particular family.
// ═══════════════════════════════════════════════════════════════════

// Colours for each koi variety, for faces, turns and dots. The painted
// koi themselves come from SpineFish (loaded with the pond).
export const KOI = {
  chagoi:   { label: 'Chagoi',    body: '#ce7c40', accent: '#965228', turn: '#c8783c' },
  kohaku:   { label: 'Kohaku',    body: '#f8f0e6', accent: '#d44234', turn: '#d44234' },
  sanke:    { label: 'Sanke',     body: '#faf4ec', accent: '#c23a2f', turn: '#b8463a', spot: '#1a181c' },
  ogon:     { label: 'Ogon',      body: '#e4ba52', accent: '#c49638', turn: '#d3a43a' },
  asagi:    { label: 'Asagi',     body: '#8696aa', accent: '#d27846', turn: '#5d7fa8' },
  showa:    { label: 'Showa',     body: '#201c1e', accent: '#ce4e1e', turn: '#e0562a' },
  hiUtsuri: { label: 'Hi-Utsuri', body: '#1c181a', accent: '#e4662a', turn: '#e4662a' },
  karasu:   { label: 'Karasu',    body: '#24262e', accent: '#6e7a8c', turn: '#7d8aa0' },
  shiro:    { label: 'Shiro',     body: '#f8f8f4', accent: '#c9ced6', turn: '#98a4b4' },
};
export const KOI_ORDER = ['chagoi', 'kohaku', 'sanke', 'ogon', 'asagi', 'showa', 'hiUtsuri', 'karasu', 'shiro'];

export function nextKoi(people) {
  const used = new Set(people.map((p) => p.koi));
  return KOI_ORDER.find((k) => !used.has(k)) || KOI_ORDER[people.length % KOI_ORDER.length];
}

export const uid = () => Math.random().toString(36).slice(2, 9);

export function person(name, kind = 'adult', koi = 'kohaku', short = '') {
  return { id: uid(), name: String(name).trim().slice(0, 24), short: String(short || '').trim().slice(0, 16), kind, koi };
}

// What a person is called on children's screens and in the kids'
// prayer: "Dad" rather than his name, if the household says so.
export const callName = (p, forKids) => (forKids && p.short ? p.short : p.name);

export const byId = (household, id) => household?.people.find((p) => p.id === id) || null;
export const peopleOf = (household, ids) => ids.map((id) => byId(household, id)).filter(Boolean);
export const isChild = (p) => p?.kind === 'child';

// "Ada", "Ada and Kit", "Ada, Kit and Noor"
export function listNames(names) {
  if (names.length <= 1) return names[0] || '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
export function andNames(people, forKids = false) {
  return listNames(people.map((p) => callName(p, forKids)));
}

// ── Carrying a household to another device ─────────────────────────
// No server: the household (and its current season's words) travel in
// the address, as base64url JSON. The rota is worked out from the
// household's id and the date, so both devices then agree on today.
const b64 = {
  enc: (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))),
};

export function shareLink(household, season) {
  const payload = { h: household, s: season ? { ...season } : null };
  return `${window.location.origin}/?join=${b64.enc(JSON.stringify(payload))}`;
}

export function readJoin(raw) {
  try {
    const { h, s } = JSON.parse(b64.dec(raw));
    if (!h || !Array.isArray(h.people) || !h.id) return null;
    const people = h.people
      .filter((p) => p && typeof p.name === 'string' && p.name.trim())
      .slice(0, 16)
      .map((p) => ({
        id: String(p.id || uid()).slice(0, 12),
        name: p.name.trim().slice(0, 24),
        short: String(p.short || '').slice(0, 16),
        kind: p.kind === 'child' ? 'child' : 'adult',
        koi: KOI[p.koi] ? p.koi : 'kohaku',
      }));
    if (!people.length) return null;
    return { household: { id: String(h.id).slice(0, 16), name: String(h.name || '').slice(0, 40), people }, season: s || null };
  } catch {
    return null;
  }
}
