# Digest: entry A

The full account, for an expert reviewer.

## Process

Discover: read the brief, the rules, the house docs, and the current app (pond, prayer rota, puzzle, abide, glance). Gate 0 asked only what would change the build: one prayer or two, who is at the table, when the week turns, and whether the memorised line stays NIV.

Research: the answers in `QA.md` became the brief. Visual research is in `DESIGN-DIRECTION.md` (picture-book stillness, a readable serif for children, devotional print, calm games). References inform the paper, the type, and the water. Nothing is copied.

Directions: three style tiles of the 06:45 prayer at 390 px, committed before the product code. The pond-as-house, the illuminated week-book, and the table. The table won. The addendum (tokens, map, taps, states, voice, an illustration method the code can sustain) is in that same document for the winner and the two rivals.

Build: one screen, `src/table/`, storage key `table.house.v1`. Old URLs redirect here. Then a browser walk at 390×844 and 1180×820, day and night, and the fixes that walk forced.

## Key decisions and trade-offs

- One NIV verse for the whole week, including Sunday. Names live in the prayer around it ("Holding Pip and Noor."), never in the line being learned.
- A sitting is per person. Dad's Amen does not mark the children.
- The week turns on Monday. Sunday is everyone, and it closes the week. On Monday the home says "A new verse this week."
- The adult sets a word down, or leaves it unsaid. With any child in the sitting, the question becomes one stone: a worry, a fight, a sorry, or nothing today. The vice-named field is gone.
- The puzzle stays the memory cut: every third word, in order, drag or tap. The words fall and then rest, so a finger can land. Matter is loaded only when play starts. Reduced motion keeps the same task with a still pile.
- Personal words are one word each. They show on the weeks page, under the family word. The family word is what the water carries. The family board can also be written directly on This season.
- The glance is the only illustrated room. The prayer is paper.
- "Lord" is set in ordinary type, not small caps. The 2011 NIV wording is used, including "refreshes" and "name's". Ten short passages, about fourteen verses, with the Biblica notice on the screen.

## The moments

| # | Moment | How it's served | Deep link |
|---|---|---|---|
| 1 | 06:45, Dad, phone, bedside | Silent cards. "Be still." Then the verse, one clause at a time, then "What got in the way?" Amen says the others can pray later. The puzzle is only a quiet link. | `/?demo=1&at=morning&h=7` |
| 2 | After dinner, children, tablet | Same verse. Children selected. One stone. Then the words fall. | `/?demo=1&h=18` and `/?demo=1&at=puzzle&h=18` |
| 3 | Sunday, household together | Everyone selected. The week's verse, not a different prayer. | `/?demo=1&on=2026-10-25&h=11` |
| 4 | A glance in passing | Water, the season word, today's line, fish that can be fed. | `/?demo=1&at=glance&h=15` |
| 5 | Clearing the ground | Adult: six plain words, or leave it unsaid. Child: one stone. | `/?demo=1&at=setdown&h=7` |
| 6 | Looking back | Six weeks at most. Who sat. Hollow marks for gaps, with no sentence about them. A sprig for weeks the verse was put back. Each person's word under the family word. | `/?demo=1&at=week` |
| 7 | New term or season | One word, a sentence, the season, four things you will actually do, a word each, who prays here. | `/?demo=1&at=season` |
| 8 | First run, fresh device | Who prays here, then one word, then the table. | `/?fresh=1` |

Also: an empty week `/?empty=1&at=week` ("Nothing has been prayed yet. That is all right."), everyone already sat `/?demo=1&at=done&h=18`, Monday's new verse `/?demo=1&on=2026-10-26&h=8`, night `/?demo=1&h=22`, reduced motion `/?demo=1&at=puzzle&still=1`.

`?demo=1` fills an invented household (Sam, Noor, Idris, Wren, Jo, Pip) and about four weeks, and it reseeds on every load. `?h=` sets the hour. `?on=` sets the date. `?still=1` reduces motion.

## Walkthroughs

**Dad, 06:45, phone width.** Opened the morning link. First card: "Be still." and "When you are ready." One tap, "On", then who the prayer is holding, then "So do not fear, for I am with you;" with the reference. He can keep tapping through the clauses without choosing anything. "What got in the way?" is a list, not a game. "hurry", then Amen. The next screen says the others can pray this later, and the main button is "That is enough". Back on the table, Sam is recorded and the children are not. The big button is gone. "Let the words fall" is quiet, "Pray again" is quiet.

Where he hesitated: "On" is a small word for "continue". It stays, because "Next" sounds like a form in a dark room. What changed: after a silent sitting the puzzle is not the hero. A morning that has been prayed should end.

**A 7-year-old and a 9-year-old, after dinner, phone and then tablet.** The table already shows the verse, "Holding Pip and Noor.", and "Sam prayed this earlier." The four children are selected. One button: Pray. "Next" through the same clauses. "I wonder what is heavy." Three stones and "Nothing today". Amen, then "Let the words fall" is the main button. They read the whole verse, the words drop, and the hint is one line: "Put the next word in the gold space." A wrong word does not fill the gap. The right words, in order, end on "That is the verse."

Where they hesitated: the slips kept bouncing, so a tap could not land. What changed: the words fall and then sleep, and a chosen slip stays still until it is placed. On the water, a hold was easy to miss, so there is also a Feed button. The instruction is still one sentence.

**A new family.** `/?fresh=1`. "Who prays here?" Ada as a grown-up, Bo as a child, then one word, Steady, then Begin. The table shows this week's verse and Pray. No sample of the other household is left behind.

## Testing

Chrome via Playwright, 390×844 and 1180×820.

- Day and `?h=22`. Night type was cream on a day-coloured panel, because `#root` painted `#efe6d6` over the night sheet. The panel no longer paints. Night home is ink `#f3eadc` on `#161c28`.
- Morning prayer through Amen, and the home after it.
- Evening prayer, the stone, the read, the fall, a rejected word, and all eleven gaps through to "That is the verse."
- Sunday, glance (including Feed), weeks, season save, first run, empty week, everyone already sat, Monday's new verse, reduced motion.
- Text at a 32 px root (200% of 16 px). No horizontal overflow. The sheet scrolls.
- Old URLs `/pray/`, `/flourish/`, `/flourish/abide/`, `/murmuration/`, `/make/` open the matching room of the table.
- `npm run build`. The physics library is its own chunk (`matter-*.js`, about 28 KB gzip) and is not in the first screen. The first script is about 58 KB gzip. `three` is not in the bundle. Manifest, icons, and the service worker are in `dist/`.
- Model tests: 8 passed (`node --test src/table/model.test.js`).

Screenshots: `screens/` has a before (today's app, phone) and an after (this entry, phone and tablet) for each moment. The Sunday before is the household prayer with the options sheet closed.

## Self-critique: what we cut and why

Cut the puzzle as the main button after a silent morning, and cut the browser's default form boxes on the season page. The morning should be allowed to end, and the season page should stay on the same paper as the prayer. Also cut, for the same reason: a second prayer on Sunday, names inside the verse, streaks, the vineyard, labs, celebration, an install banner on the prayer, and any creature under the verse.

## Known gaps and bugs

- `?demo=1` reseeds on every load. A sitting made in that tab lasts until refresh.
- There is no import of the old prayer history, vineyard, or wall.
- Settled slips can still overlap. A child can drag one free. It is not perfect.
- The youngest, who cannot read, is in the household and not given a separate mode. Sound for that child is named in the pitch and not built.
- The service worker caches after a first visit. It does not precache the whole font set.
- Personal boards are one word on the weeks page, not a second illustrated place.
- Printing the verse is from The weeks. There is no lock-screen card.
- Gold is a two-pixel line under the live gap. It is the right restraint, and it is easier to miss than a filled chip.

## Calls made without asking

- Sunday keeps this week's NIV verse. The old app used the Lord's Prayer that day. One stable wording won.
- "Lord", not small-capitals LORD.
- The verse paper does not change with the season. Only the water does.
- Before 9:00 the icon opens "Be still." when the first grown-up has not yet sat. Otherwise the verse is already on the table. Either way it is within two taps of the first line.
- A mixed sitting uses the child's stone, not the adult list.
- The puzzle is hidden until the people selected now have prayed. `?at=puzzle` still opens it, for review.
- Gaps are hollow marks. Only a history with no sittings at all says "Nothing has been prayed yet. That is all right."
- The install hint lives on This season, not on the prayer.
- `product-review` is kept. `abide-direction` is kept for the glance and overturned for the prayer: paper, no wind, no creatures under the verse.

## With another day

A spoken reading of the verse for a child who cannot read yet. A one-off import of the old sittings. A bedside card that is the verse and nothing else. Sync, once there is a household to sync. Not more rooms.
