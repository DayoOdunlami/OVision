import { FAMILY } from '../../shared/family.js';
import {
  prayers, blessing, lordsPrayer, petitionPrompts, kidsPetitionPrompts,
} from '../data/prayers.js';
import { buildPrayerContext, familyContext, pairLabel, listNames } from './context.js';

// ═══════════════════════════════════════════════════════════════════
// script.js — "what does this day's prayer consist of?"
//
// One function answers that for all three ways of praying:
//
//   reading view  → `body` + `blessing` + `prompt`
//   Pray it       → `steps` (one thought per card) + `blessing`
//   puzzle        → `steps` again, one verse per round
//
// Keeping it in one place is what guarantees the three modes never
// disagree about the words.
// ═══════════════════════════════════════════════════════════════════

export function buildDay(state, dayIndex) {
  const mode = state.mode;
  const spoken = state.spokenView;
  const prayer = prayers[state.prayerIndex];
  const isKids = mode === 'kids' && !spoken;

  // ── Sunday: the whole household, the Lord's Prayer ────────────────
  if (dayIndex === 6) {
    const ctx = familyContext();
    const names = listNames(FAMILY.map((p) => (isKids ? p.label : p.name)));
    const stanzas = lordsPrayer.text.split('<br><br>');
    const blessingHtml = isKids
      ? `May the Lord bless <span class="name-highlight">our family</span> and keep <span class="pronoun">us</span> safe.<br>May the Lord smile on <span class="pronoun">us</span> and be kind to <span class="pronoun">us</span>.<br>May the Lord look at <span class="pronoun">us</span> and give <span class="pronoun">us</span> peace.`
      : `The Lord bless <span class="name-highlight">this family</span> and keep <span class="pronoun">us</span>;<br>the Lord make his face shine on <span class="pronoun">us</span> and be gracious to <span class="pronoun">us</span>;<br>the Lord turn his face toward <span class="pronoun">us</span> and give <span class="pronoun">us</span> peace.`;

    return {
      isSunday: true,
      who: { a: 'All of us', b: null },
      subtitle: `Holding before God: ${names}`,
      prayer,
      title: 'The Lord’s Prayer',
      body: { kind: 'lords', html: lordsPrayer.text, explain: spoken ? lordsPrayer.explain : null },
      steps: stanzas.map((html) => ({ html })),
      blessingHtml,
      blessingExplain: spoken ? blessing.explain(ctx) : null,
      prompt: null,
      instruction: null,
      closing: isKids ? 'That’s it. You just prayed. God heard you.' : null,
      logNames: 'Whole family',
      // Real names (never kids' labels) — used to pick whose koi swims
      // past when the puzzle is finished — and the key the puzzle
      // records as "learned".
      people: FAMILY.map((p) => p.name),
      learnKey: 'The Lord’s Prayer',
    };
  }

  const pair = state.weekPairs[dayIndex];
  if (!pair) return null;
  const p1 = FAMILY[pair[0]];
  const p2 = FAMILY[pair[1]];

  // Spoken view is always first-person, which is why it uses the solo
  // context regardless of the selected voice (as in the original).
  const ctxMode = spoken ? 'solo' : mode;
  const ctx = buildPrayerContext(p1, p2, ctxMode, state.selfName);
  const who = pairLabel(p1, p2, ctxMode, state.selfName);

  // Petition prompt — rotates by weekday.
  const promptList = isKids ? kidsPetitionPrompts : petitionPrompts;
  const promptA = ctx.selfIncluded ? who.a : ctx.n1;
  const promptB = ctx.selfIncluded ? 'me' : ctx.n2;
  const prompt = promptList[dayIndex % promptList.length](promptA, promptB);

  let body;
  let steps;
  if (spoken) {
    const sections = prayer.sections.map((s) => ({ html: s.spoken(ctx), explain: s.explain(ctx) }));
    body = { kind: 'sections', sections };
    steps = sections;
  } else {
    const flowing = prayer.flowing[mode](ctx);
    body = { kind: 'flowing', paragraphs: flowing.split('\n\n') };
    // Pray it and the puzzle work a thought at a time. For adults the
    // spoken sections are the natural unit; for kids the flowing kids
    // text is already short, so each paragraph is a step.
    steps = isKids
      ? flowing.split('\n\n').map((html) => ({ html }))
      : prayer.sections.map((s) => ({
          html: s.spoken(buildPrayerContext(p1, p2, 'solo', state.selfName)),
          explain: s.explain(buildPrayerContext(p1, p2, 'solo', state.selfName)),
        }));
  }

  const blessingMode = spoken ? 'solo' : mode;
  return {
    isSunday: false,
    who,
    subtitle: null,
    prayer,
    title: prayer.theme,
    body,
    steps,
    blessingHtml: blessing.flowing[blessingMode](ctx).replace(/\n/g, '<br>'),
    blessingExplain: spoken ? blessing.explain(ctx) : null,
    prompt,
    instruction: mode === 'family' && !spoken
      ? 'One voice reads the prayer. Everyone joins for the blessing.'
      : null,
    closing: isKids ? 'That’s it. You just prayed. God heard you.' : null,
    logNames: who.b ? `${who.a} & ${who.b}` : who.a,
    people: [p1.name, p2.name],
    learnKey: prayer.ref,
  };
}

// Short "who" for a day, used by the day picker in the sheet.
export function dayWho(state, dayIndex) {
  if (dayIndex === 6) return 'Everyone';
  const pair = state.weekPairs[dayIndex];
  if (!pair) return '—';
  const w = pairLabel(FAMILY[pair[0]], FAMILY[pair[1]], state.mode, state.selfName);
  return `${w.a} & ${w.b}`;
}
