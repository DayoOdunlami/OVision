// ═══════════════════════════════════════════════════════════════════
// context.js — turns two people into the grammar a prayer needs.
//
// Ported from the original app. The one behavioural change: "who am
// I" is a parameter (`selfName`) instead of a module-level global, so
// it can't drift out of sync with state.
// ═══════════════════════════════════════════════════════════════════

const hl = (name) => `<span class="name-highlight">${name}</span>`;
const pr = (word) => `<span class="pronoun">${word}</span>`;

// Solo mode rewrites the grammar when you're one of the pair
// ("Bella and me", "we", "our") — but only in Solo, because in
// Together/Kids someone else may be reading aloud.
export function buildPrayerContext(p1, p2, mode, selfName) {
  const isSelf = (p) => p && p.name === selfName;
  const selfIncluded = mode === 'solo' && (isSelf(p1) || isSelf(p2));
  const useLabel = mode === 'kids';
  const n1 = useLabel ? p1.label : p1.name;
  const n2 = useLabel ? p2.label : p2.name;

  let pair, pairSubj, pairPossessive;
  if (selfIncluded) {
    const other = isSelf(p1) ? p2 : p1;
    pair = `${hl(other.name)} and me`;
    pairSubj = `${hl(other.name)} and I`;
    pairPossessive = 'our';
  } else {
    pair = `${hl(n1)} and ${hl(n2)}`;
    pairSubj = pair;
    pairPossessive = `${hl(n1)} and ${hl(n2)}'s`;
  }

  return {
    n1, n2, selfIncluded, pair, pairSubj, pairPossessive,
    they:       selfIncluded ? 'we'        : 'they',
    them:       selfIncluded ? 'us'        : 'them',
    their:      selfIncluded ? 'our'       : 'their',
    themselves: selfIncluded ? 'ourselves' : 'themselves',
    theyP:  pr(selfIncluded ? 'we'  : 'they'),
    themP:  pr(selfIncluded ? 'us'  : 'them'),
    theirP: pr(selfIncluded ? 'our' : 'their'),
  };
}

// Context for Sunday, when the whole household is prayed for together.
export function familyContext() {
  return {
    selfIncluded: true,
    they: 'we', them: 'us', their: 'our', themselves: 'ourselves',
    pair: hl('this family'),
    pairSubj: hl('this family'),
    pairPossessive: 'our',
    theyP: pr('we'), themP: pr('us'), theirP: pr('our'),
  };
}

// The print sheet: names become blank lines to fill in by hand.
const SLOT = '<span class="ps-slot">&nbsp;</span>';
export function blankContext() {
  return {
    n1: '', n2: '', selfIncluded: false,
    pair: `${SLOT} and ${SLOT}`,
    pairSubj: `${SLOT} and ${SLOT}`,
    pairPossessive: `${SLOT} and ${SLOT}'s`,
    they: 'they', them: 'them', their: 'their', themselves: 'themselves',
    theyP: 'they', themP: 'them', theirP: 'their',
  };
}

// "a, b and c"
export function listNames(names) {
  if (names.length <= 1) return names[0] || '';
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
}

// How a pair is spoken of in headings: "Florence & Ezra" or "Bella & me".
export function pairLabel(p1, p2, mode, selfName) {
  const selfIncluded = mode === 'solo' && (p1.name === selfName || p2.name === selfName);
  if (selfIncluded) {
    const other = p1.name === selfName ? p2 : p1;
    return { a: other.name, b: 'me' };
  }
  const useLabel = mode === 'kids';
  return { a: useLabel ? p1.label : p1.name, b: useLabel ? p2.label : p2.name };
}
