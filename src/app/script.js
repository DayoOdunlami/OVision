// ═══════════════════════════════════════════════════════════════════
// script.js — what today's sitting consists of.
//
// One prayer a day for the household. Different people meet it at
// different times, so the *sitting* adapts to who is in the room
// rather than asking for settings:
//
//   solo      one grown-up, usually 06:45, silent. "I".
//   together  grown-ups only, one reads aloud. "We".
//   children  any child present: simple words, turns to read aloud,
//             an "I wonder…", then play.
//   sunday    the whole household: the Lord's Prayer, everyone named,
//             the week's verse said together, the week looked back on.
//
// The order is the same every day (still → Scripture → pray → ask →
// bless → Amen), so it becomes muscle memory.
// ═══════════════════════════════════════════════════════════════════

import { prayers, blessing, lordsPrayer, petitionPrompts, kidsPetitionPrompts } from './content/prayers.js';
import { buildPrayerContext, familyContext } from './content/context.js';
import { VERSES } from './content/verses.js';
import { callName, isChild, andNames } from './household.js';

const hl = (s) => `<span class="name-highlight">${s}</span>`;
const pr = (s) => `<span class="pronoun">${s}</span>`;

// The prayers were written for the morning. Say the time it is.
function timely(html, part) {
  const when = { morning: 'this morning', afternoon: 'today', evening: 'this evening', night: 'tonight' }[part] || 'today';
  return html.replace(/this morning/g, when);
}

// Grammar for one or two people, in a given voice.
function contextFor(forPeople, voice, self) {
  const kids = voice === 'kids';
  const as = (p) => ({ name: p.name, label: callName(p, true) });
  if (forPeople.length >= 2) {
    return buildPrayerContext(as(forPeople[0]), as(forPeople[1]), voice, self?.name);
  }
  const p = forPeople[0];
  const isSelf = voice === 'solo' && self && p.id === self.id;
  const n = kids ? callName(p, true) : p.name;
  if (isSelf) {
    return {
      n1: n, n2: '', selfIncluded: true, pair: 'me', pairSubj: 'I', pairPossessive: 'my',
      they: 'I', them: 'me', their: 'my', themselves: 'myself',
      theyP: pr('I'), themP: pr('me'), theirP: pr('my'),
    };
  }
  return {
    n1: n, n2: '', selfIncluded: false, pair: hl(n), pairSubj: hl(n), pairPossessive: `${hl(n)}'s`,
    they: 'they', them: 'them', their: 'their', themselves: 'themselves',
    theyP: pr('they'), themP: pr('them'), theirP: pr('their'),
  };
}

export function sittingKind(present, isSunday) {
  if (isSunday) return 'sunday';
  if (present.some(isChild)) return 'children';
  if (present.length <= 1) return 'solo';
  return 'together';
}

const VOICE = { solo: 'solo', together: 'family', children: 'kids' };

// Who reads each card aloud, in turn: children first, then grown-ups.
function readers(present) {
  const kids = present.filter(isChild);
  const grown = present.filter((p) => !isChild(p));
  return [...kids, ...grown];
}

export function buildSitting({ present, forPeople, everyone, prayerIdx, isSunday, part, earlier, simpleWords }) {
  const kind = sittingKind(present, isSunday);
  const prayer = prayers[prayerIdx];
  const verse = VERSES[prayerIdx];
  const hasKids = present.some(isChild);
  const voice = kind === 'sunday' ? (hasKids || simpleWords ? 'kids' : 'family') : simpleWords ? 'kids' : VOICE[kind];
  const forKids = voice === 'kids';
  const self = kind === 'solo' ? present[0] : null;
  const order = readers(present);
  const turn = (i) => (order.length > 1 && (kind === 'children' || (kind === 'sunday' && hasKids)) ? order[i % order.length] : null);
  const steps = [];

  if (kind === 'sunday') {
    steps.push({ type: 'still', title: 'All of us', breath: verse.breath, sunday: true });
    const stanzas = lordsPrayer.text.split('<br><br>');
    stanzas.forEach((html, i) => steps.push({ type: 'pray', html, label: i === 0 ? 'The Lord’s Prayer' : null, together: true }));
    const ctx = familyContext();
    const bless = blessing.flowing[forKids ? 'kids' : 'family'](ctx)
      .replace(/this family/g, 'this family')
      .replace(/\n/g, '<br>');
    steps.push({ type: 'everyone', people: everyone, html: bless });
    steps.push({ type: 'verse', verse, together: true, heart: true });
    steps.push({ type: 'week' });
    steps.push({ type: 'amen' });
    return { kind, voice, verse, prayer, forPeople: everyone, steps, title: 'All of us' };
  }

  const ctx = contextFor(forPeople, voice, self);
  const names = forPeople.length ? andNames(forPeople, forKids) : '';
  const title = self && forPeople.some((p) => p.id === self.id)
    ? `${andNames(forPeople.filter((p) => p.id !== self.id))}${forPeople.length > 1 ? ' & me' : 'me'}`
    : forPeople.map((p) => callName(p, forKids)).join(' & ');

  if (kind === 'children') {
    steps.push({ type: 'here', forPeople, earlier });
  } else {
    steps.push({ type: 'still', title, breath: verse.breath });
  }

  steps.push({ type: 'verse', verse, twice: kind !== 'children', together: kind !== 'solo' });

  const flowing = timely(prayer.flowing[voice](ctx), part);
  flowing.split('\n\n').forEach((html, i) => steps.push({ type: 'pray', html, reader: turn(i) }));

  if (kind === 'children') {
    steps.push({ type: 'wonder', text: verse.wonder });
  } else {
    const a = forPeople[0] ? callName(forPeople[0], false) : '';
    const b = forPeople[1] ? callName(forPeople[1], false) : '';
    const list = petitionPrompts;
    const day = new Date().getDay();
    const prompt = forPeople.length >= 2
      ? list[day % list.length](a, b)
      : `What does ${a} need from God today?`;
    steps.push({ type: 'ask', prompt: timely(prompt, part), names, line: kind === 'solo' });
  }

  const bless = blessing.flowing[voice](ctx).replace(/\n/g, '<br>');
  steps.push({ type: 'bless', html: bless, together: kind !== 'solo' });
  steps.push({ type: 'amen' });

  // A kids' petition prompt, for the "I wonder" card's companion.
  const kidsPrompt = forPeople.length >= 2
    ? kidsPetitionPrompts[new Date().getDay() % kidsPetitionPrompts.length](callName(forPeople[0], true), callName(forPeople[1], true))
    : null;

  // The notes on the passage (Greek and Hebrew), offered after Amen to
  // anyone who wants to read more. Never during the prayer itself.
  const notes = forPeople.length >= 2 && kind !== 'children'
    ? prayer.sections.map((s) => s.explain(buildPrayerContext(
      { name: forPeople[0].name, label: forPeople[0].name },
      { name: forPeople[1].name, label: forPeople[1].name }, 'family', null)))
    : [];

  return { kind, voice, verse, prayer, forPeople, steps, title, kidsPrompt, notes };
}
